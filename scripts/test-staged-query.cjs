const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const assert = require("node:assert/strict");

const forbiddenImports = ["@antelopejs/interface-core", "node:async_hooks"];

const loadGuard = Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    assert.equal(
      forbiddenImports.includes(specifier),
      false,
      `staged query imported ${specifier}`,
    );
    return nextResolve(specifier, context);
  },
});

const staged = require("../dist/staged-query");
loadGuard.deregister();

const schema = new staged.Schema("parity", {
  posts: { fields: {}, indexes: {} },
});
const query = schema
  .instance("default")
  .table("posts")
  .filter((post) => post.key("author").eq("Alice"))
  .orderBy("views", "desc")
  .slice(0, 10);

assert.deepEqual(query.build(), [
  { stage: "schema", options: { id: "parity" }, args: [] },
  { stage: "instance", options: { id: "default" }, args: [] },
  { stage: "table", options: { id: "posts" }, args: [] },
  {
    stage: "filter",
    options: undefined,
    args: [
      {
        stage: "func",
        args: [
          [0],
          new staged.ValueProxy({
            stage: "arg",
            options: undefined,
            args: [0],
          })
            .key("author")
            .eq("Alice"),
        ],
      },
    ],
  },
  {
    stage: "orderBy",
    options: { index: "views", direction: "desc" },
    args: [],
  },
  { stage: "slice", options: undefined, args: [0, 10] },
]);

for (const method of ["run", "then", "cursor"]) {
  assert.equal(method in query, false, `staged query exposes ${method}`);
}
assert.equal(Symbol.asyncIterator in query, false);

const atomicQuery = schema
  .instance("default")
  .table("posts")
  .atomicMutation("post-000", {
    type: "deleteIfEqual",
    field: "author",
    expectedValue: "Nobody",
  });
assert.equal(atomicQuery instanceof staged.AtomicMutationQuery, true);
assert.equal("run" in atomicQuery, false);

const distDirectory = path.join(__dirname, "../dist/staged-query");
for (const file of fs.readdirSync(distDirectory)) {
  if (!file.endsWith(".js")) continue;
  const source = fs.readFileSync(path.join(distDirectory, file), "utf8");
  for (const forbidden of forbiddenImports) {
    assert.equal(
      source.includes(forbidden),
      false,
      `${file} contains ${forbidden}`,
    );
  }
}

const ts = require("typescript");
const typeProbeFile = path.join(__dirname, "../staged-query-types.ts");
const typeProbe = `
import { Datum, Query, Stream, ValueProxy, type ExtractType } from "./dist/staged-query";
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const datum: Same<ExtractType<Datum<number>>, number> = true;
export const stream: Same<ExtractType<Stream<string>>, string[]> = true;
export const record: Same<ExtractType<{ n: Datum<number>; s: ValueProxy<string> }>, { n: number; s: string }> = true;
export const distinct: Same<[Query<string>] extends [Query<number>] ? true : false, false> = true;
`;
const typeHost = ts.createCompilerHost({});
const readDiskFile = typeHost.readFile.bind(typeHost);
const diskFileExists = typeHost.fileExists.bind(typeHost);
const diskSourceFile = typeHost.getSourceFile.bind(typeHost);
typeHost.readFile = (file) =>
  file === typeProbeFile ? typeProbe : readDiskFile(file);
typeHost.fileExists = (file) => file === typeProbeFile || diskFileExists(file);
typeHost.getSourceFile = (file, version, onError, fresh) =>
  file === typeProbeFile
    ? ts.createSourceFile(file, typeProbe, version, true)
    : diskSourceFile(file, version, onError, fresh);
const typeProgram = ts.createProgram({
  rootNames: [typeProbeFile],
  options: {
    strict: true,
    noEmit: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    types: [],
  },
  host: typeHost,
});
const typeErrors = ts
  .getPreEmitDiagnostics(typeProgram)
  .map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  );
assert.deepEqual(typeErrors, [], "staged-query types read T back from queries");

const executable = require("../dist/index");
const executableTable = new executable.Schema("runtime", {
  records: { fields: {}, indexes: {} },
})
  .instance()
  .table("records");
const executableInsert = executableTable.insert({});

assert.equal(executableTable instanceof executable.Table, true);
assert.equal(executableTable instanceof executable.Selection, true);
assert.equal(executableTable instanceof executable.Stream, true);
assert.equal(executableTable instanceof executable.Query, true);
assert.equal("run" in executableTable, true);
assert.equal("then" in executableTable, false, "root query is not thenable");
assert.equal("atomicMutation" in executableTable, true);
assert.equal(executableInsert instanceof executable.Query, true);
assert.equal("run" in executableInsert, true);

const originalRun = Object.getOwnPropertyDescriptor(
  executable.Query.prototype,
  "run",
);
executable.Query.prototype.run = async () => "not-applied";
const executableAtomic = executableTable.atomicMutation("record-1", {
  type: "deleteIfEqual",
  field: "status",
  expectedValue: "draft",
});
void executableAtomic
  .run()
  .then((result) => assert.equal(result, "not-applied"))
  .finally(() => {
    Object.defineProperty(executable.Query.prototype, "run", originalRun);
  })
  .then(() => {
    console.log(
      "staged-query purity, AQL stages, and root compatibility: PASS",
    );
  });
