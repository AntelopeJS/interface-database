import { equal } from "@antelopejs/tooling-configs/verify";
import type { Journey, JourneyContext } from "@antelopejs/tooling-configs/verify";

/** A value a scenario prints: the JSON a journey compares with the recorded expectation. */
export type Printed = string | number | boolean | null | Printed[] | { [key: string]: Printed };

/**
 * The consumer side of every scenario: the packed interface is required next to a provider that records what it is asked to run.
 * `answer` is what `RunQuery` resolves to, `seen` collects the stages the provider received, and `show` renders a query or a stage list the way a driver reads it.
 */
export const PRELUDE = `
const path = require("node:path");
const dist = path.join(process.argv[2], "dist");
const core = require(require.resolve("@antelopejs/interface-core", { paths: [dist] }));
const db = require(path.join(dist, "index.js"));
const queryModule = require(path.join(dist, "query.js"));
const schemaModule = require(path.join(dist, "schema.js"));
const seen = { runs: [], reads: [], closes: [], schemas: [] };
let answer = [];
let readAnswers = [];
core.ImplementInterface(queryModule, {
  RunQuery: (stages) => { seen.runs.push(stages); return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer); },
  ReadCursor: (id, stages) => { seen.reads.push([id, stages]); const next = readAnswers.shift(); return Promise.resolve(next ?? { done: true, value: undefined }); },
  CloseCursor: (id) => { seen.closes.push(id); },
});
core.ImplementInterface(schemaModule, {
  Schemas: { register: (name, definition) => { seen.schemas.push([name, definition]); }, unregister: () => {} },
});
const showValue = (value, ids) => {
  if (value === undefined) return "undefined";
  if (typeof value === "symbol") return String(value);
  if (value instanceof Date) return "date:" + value.toISOString();
  if (value instanceof Error) return value.name + ":" + value.message;
  if (Array.isArray(value)) return "[" + value.map((item) => showValue(item, ids)).join(",") + "]";
  if (value && typeof value.build === "function") return "(" + value.build().map((stage) => showStage(stage, ids)).join(" > ") + ")";
  if (value && typeof value.stage === "string" && Array.isArray(value.args)) return "{" + showStage(value, ids) + "}";
  if (value && typeof value === "object") return "{" + Object.keys(value).map((key) => key + ":" + showValue(value[key], ids)).join(",") + "}";
  return JSON.stringify(value);
};
const argIndex = (ids, id) => { if (!ids.has(id)) ids.set(id, ids.size); return ids.get(id); };
const showStage = (stage, ids) => {
  const options = stage.options === undefined ? "" : showValue(stage.options, ids);
  if (stage.stage === "arg") return "arg#" + argIndex(ids, stage.args[0]) + options;
  if (stage.stage === "func") return "func[" + stage.args[0].map((id) => "#" + argIndex(ids, id)).join(",") + "]" + showValue(stage.args[1], ids);
  return stage.stage + options + (stage.args.length === 0 ? "" : stage.args.map((arg) => "<" + showValue(arg, ids) + ">").join(""));
};
const show = (query) => (Array.isArray(query) ? query : query.build()).map((stage) => showStage(stage, new Map()));
const fails = async (action) => { try { await action(); return "no error"; } catch (error) { return error.name + ": " + error.message; } };
const sleepTick = () => new Promise((resolve) => setImmediate(resolve));
`;

const TAIL = `
main().then((out) => { console.log(JSON.stringify(out)); process.exit(0); }, (error) => { console.error(error); process.exit(1); });
`;

/** Runs a scenario body in a Node process against the packed interface (`dist/` of the repository) and checks the JSON it prints. */
export function scenario(title: string, label: string, body: string, expected: Printed): Journey {
  return {
    title,
    entryPoint: "the packed interface required from a consumer, with a provider that records what it is asked to run",
    async run(context: JourneyContext) {
      const file = `${context.work}/scenario.js`;
      context.edit("write the scenario", file, `${PRELUDE}\nasync function main() {\n${body}\n}\n${TAIL}`);
      const ran = await context.command(label, "node", [file, context.repo], { cwd: context.repo, timeoutMs: 60_000 });
      context.expect(ran.folder, [
        { name: `${label} ended cleanly`, pass: ran.exitCode === 0, detail: ran.stderr.slice(-400) },
        equal(`${label} answers as docs/ states`, ran.stdout.trim().split("\n").at(-1) ?? "", JSON.stringify(expected)),
      ]);
    },
  };
}

/** Runs a script that needs no provider against the packed interface (`dist/` of the repository), for the build-only entry point and the package's exports map. */
export function plain(title: string, label: string, script: string, expected: Printed, entryPoint: string): Journey {
  return {
    title,
    entryPoint,
    async run(context: JourneyContext) {
      const file = `${context.work}/plain.js`;
      context.edit("write the script", file, `const path = require("node:path");\nconst repo = process.argv[2];\nconst dist = path.join(repo, "dist");\n${script}`);
      const ran = await context.command(label, "node", [file, context.repo], { cwd: context.repo, timeoutMs: 60_000 });
      context.expect(ran.folder, [
        { name: `${label} ended cleanly`, pass: ran.exitCode === 0, detail: ran.stderr.slice(-400) },
        equal(`${label} answers as docs/ states`, ran.stdout.trim().split("\n").at(-1) ?? "", JSON.stringify(expected)),
      ]);
    },
  };
}

/** The header of a type probe: `Assert<Same<A, B>>` fails to compile when A and B are not assignable both ways. */
export const PROBE_HEADER = `
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Accepts<Target, Value> = [Value] extends [Target] ? true : false;
type Not<T extends boolean> = T extends true ? false : true;
type Assert<T extends true> = T;
`;

/** Compiles a probe against the packed declarations in a consumer's strict mode. */
export function declared(title: string, probe: string, label: string): Journey {
  return {
    title,
    entryPoint: "a TypeScript consumer compiling against the packed declarations",
    async run(context) {
      const file = `${context.work}/probe.ts`;
      context.edit("write the type probe", file, `import type * as Api from "${context.repo}/dist/index";\n${PROBE_HEADER}\n${probe.replaceAll("$REPO", context.repo)}`);
      const compiled = await context.command("compile the type probe", "node", [
        `${context.repo}/node_modules/typescript/bin/tsc`,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--target",
        "es2022",
        "--module",
        "commonjs",
        "--moduleResolution",
        "node",
        "--typeRoots",
        `${context.repo}/node_modules/@types`,
        "--types",
        "node",
        file,
      ]);
      context.expect(compiled.folder, [{ name: label, pass: compiled.exitCode === 0, detail: compiled.stdout.slice(0, 600) }]);
    },
  };
}
