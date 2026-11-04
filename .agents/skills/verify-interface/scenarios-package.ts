/** The build-only entry point and the package's exports map, run without a provider. */
export const STAGED_SCRIPT = `
const Module = require("node:module");
const blocked = [];
const guard = Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["@antelopejs/interface-core", "node:async_hooks"].includes(specifier)) blocked.push(specifier);
    return nextResolve(specifier, context);
  },
});
const staged = require(path.join(dist, "staged-query"));
guard.deregister();
const fs = require("node:fs");
const folder = path.join(dist, "staged-query");
const leaks = fs.readdirSync(folder).filter((file) => file.endsWith(".js")).filter((file) => ["@antelopejs/interface-core", "node:async_hooks"].some((name) => fs.readFileSync(path.join(folder, file), "utf8").includes(name)));
const schema = new staged.Schema("parity", { posts: { fields: {}, indexes: {} } });
const query = schema.instance("default").table("posts").filter((post) => post.key("author").eq("Alice")).orderBy("views", "desc").slice(0, 10);
const atomic = schema.instance("default").table("posts").atomicMutation("post-000", { type: "deleteIfEqual", field: "author", expectedValue: "Nobody" });
const has = (value, names) => names.map((name) => name in value);
const before = { query: has(query, ["run", "then", "cursor"]), iterator: Symbol.asyncIterator in query, atomic: "run" in atomic, schemaList: typeof staged.Schema.list };
const names = Object.keys(staged).sort();
const built = JSON.stringify(query.build());
const isolation = { blocked, leaks, before, atomicKind: [atomic instanceof staged.AtomicMutationQuery, atomic instanceof staged.Query], hasBuild: typeof query.build };
const root = require(path.join(dist, "index.js"));
const after = { query: has(query, ["run", "then", "cursor"]), iterator: Symbol.asyncIterator in query, sameClasses: [root.Query === staged.Query, root.Stream === staged.Stream, root.Table === staged.Table, root.ValueProxy === staged.ValueProxy, root.Datum === staged.Datum] };
console.log(JSON.stringify({ isolation, names, built, after }));
`;

export const SUBPATH_SCRIPT = `
const manifest = require(path.join(repo, "package.json"));
const exported = Object.keys(manifest.exports).filter((key) => key !== "./package.json");
const typed = Object.keys(manifest.typesVersions["*"]).map((key) => "./" + key);
const here = require("node:module").createRequire(path.join(repo, "consumer.js"));
const subpaths = {};
for (const key of exported) {
  const loaded = here(manifest.name + key.slice(1));
  subpaths[key] = Object.keys(loaded).filter((name) => name !== "__esModule").sort();
}
console.log(JSON.stringify({ exported, typedAsExported: JSON.stringify(typed.sort()) === JSON.stringify(exported.filter((key) => key !== ".").sort()), files: manifest.files, subpaths }));
`;
