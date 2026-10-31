import { equal, interrupted } from "@antelopejs/tooling-configs/verify";
import type { Journey, VerifyConfig } from "@antelopejs/tooling-configs/verify";

import { EXPECTED as EXPRESSIONS } from "./expected-expressions.ts";
import { STAGED, SUBPATHS } from "./expected-package.ts";
import { EXPECTED as RUNTIME } from "./expected-runtime.ts";
import { EXPECTED as STREAMS } from "./expected-streams.ts";
import { EXPECTED as TABLES } from "./expected-tables.ts";
import { USAGE_TYPES } from "./probes.ts";
import { declared, plain, scenario } from "./scenario-kit.ts";
import { ARITHMETIC_BODIES, COMPARISON_BODIES, TEXT_DATE_ARRAY_BODIES } from "./scenarios-expressions.ts";
import { STAGED_SCRIPT, SUBPATH_SCRIPT } from "./scenarios-package.ts";
import { ATOMIC_BODIES, EXECUTION_BODIES, KIND_BODIES } from "./scenarios-runtime.ts";
import { DATUM_BODIES, JOIN_BODIES, STREAM_BODIES } from "./scenarios-streams.ts";
import { SCHEMA_BODIES, TABLE_BODIES } from "./scenarios-tables.ts";

/** The database interface's own proxies: a consumer module reaches them through core and the stub provider answers. */
const through: Journey = {
  title: "the query proxies and the schema registry answer through core from a stub provider",
  entryPoint: "a consumer module calling the packed interface in `ajs project dev`",
  async run(context) {
    const app = await context.dev("ajs project dev", context.fixture());
    const stages = [
      { stage: "schema", options: { id: "demo" }, args: [] },
      { stage: "instance", options: { id: "default" }, args: [] },
      { stage: "table", options: { id: "notes" }, args: [] },
    ];
    for (const { path, args } of [
      { path: ["RunQuery"], args: [stages] },
      { path: ["ReadCursor"], args: [0, stages] },
      { path: ["CloseCursor"], args: [0] },
    ]) {
      const result = await context.call(`call ${path[0]}`, app, { entry: "./query", path, args });
      context.expect(result.folder, [
        { name: `${path[0]} resolved through core`, pass: result.ok, detail: JSON.stringify(result.value) },
        equal(`${path[0]} reached the provider with its arguments`, result.value, { stub: `./query:${path[0]}`, args }),
      ]);
    }
    const registered = await context.call("call Schemas.register", app, {
      entry: "./schema",
      path: ["Schemas", "register"],
      args: ["demo", { notes: { fields: { title: "string" }, indexes: {} } }],
    });
    context.expect(registered.folder, [{ name: "Schemas.register resolved through core", pass: registered.ok, detail: JSON.stringify(registered.value) }]);
    const stopped = await context.stop("SIGINT", app);
    context.expect(stopped.folder, [interrupted(stopped)]);
  },
};


const config: VerifyConfig = {
  doors: {
    data: null,
    format: {
      globs: ["src/staged-query/**", "src/errors.ts"],
      funnels: [],
      containments: ["streams/stream-shape"],
      why: "the stage names, options and arguments the builders record are what every database module decodes, and the kind markers recognise queries and errors across copies of the interface",
    },
    contract: {
      globs: ["src/index.ts", "src/staged-query/index.ts", "package.json"],
      funnels: [],
      containments: [],
      why: "the export map and the root entry are what every database module and every query-writing module imports",
    },
    outbound: null,
    exposure: null,
    publish: {
      globs: ["package.json", ".release-it.json", "changelogen.config.json", ".github/workflows/release.yml"],
      funnels: [],
      containments: [],
      why: "the package name and release workflow claim @antelopejs/interface-database on npm",
    },
  },
  journeys: {
    "through-core": through,
    "schema-registry": scenario("a Schema registers with the provider, and Schema.get and Schema.list find it", "schema registry", SCHEMA_BODIES["schema-registry"], TABLES["schema-registry"]),
    "schema-stages": scenario("instance, createInstance, destroyInstance and listInstances record the stages docs/3.results/5.database_changes.md names", "schema stages", SCHEMA_BODIES["schema-stages"], TABLES["schema-stages"]),
    "schema-run": scenario("awaiting a schema call runs it once, and building one runs nothing", "schema run", SCHEMA_BODIES["schema-run"], TABLES["schema-run"]),
    "table-reads": scenario("get, getAll and between record the key, index and bounds docs/1.query_types/2.table.md describes", "table reads", TABLE_BODIES["table-reads"], TABLES["table-reads"]),
    "table-writes": scenario("insert, update, replace, delete and changes record the stages docs/2.operations/4.crud.md describes", "table writes", TABLE_BODIES["table-writes"], TABLES["table-writes"]),
    "table-results": scenario("a write resolves to what the provider answered, and a provider failure rejects the caller", "table results", TABLE_BODIES["table-results"], TABLES["table-results"]),
    "stream-shape": scenario("key, default, map, filter, pluck, without and union record their stages in order", "stream shape", STREAM_BODIES["stream-shape"], STREAMS["stream-shape"]),
    "stream-order": scenario("orderBy, slice and nth record index, direction and bounds, and never change the stream they extend", "stream order", STREAM_BODIES["stream-order"], STREAMS["stream-order"]),
    "stream-aggregates": scenario("count, sum, avg, min, max, distinct and changes record the field they work on", "stream aggregates", STREAM_BODIES["stream-aggregates"], STREAMS["stream-aggregates"]),
    "stream-run": scenario("awaiting a stream hands the provider the stages and returns its answer", "stream run", STREAM_BODIES["stream-run"], STREAMS["stream-run"]),
    "join-stages": scenario("join, joinInner and lookup record the right side, the predicate and the mapper", "join stages", JOIN_BODIES["join-stages"], STREAMS["join-stages"]),
    "group-stages": scenario("group records its index and a mapper over the sub-stream and the group key", "group stages", JOIN_BODIES["group-stages"], STREAMS["group-stages"]),
    "datum-stages": scenario("key, default, do, lookup, pluck and cast on one document record docs/1.query_types/8.datum.md", "datum stages", DATUM_BODIES["datum-stages"], STREAMS["datum-stages"]),
    "datum-run": scenario("awaiting a document or one of its fields returns the provider's answer, null included", "datum run", DATUM_BODIES["datum-run"], STREAMS["datum-run"]),
    "expression-logic": scenario("eq, ne, and, or, not, comparisons and default record their operand", "expression logic", COMPARISON_BODIES["expression-logic"], EXPRESSIONS["expression-logic"]),
    "expression-objects": scenario("key, merge, keys, values and hasfields record the field access of a ValueProxy", "expression objects", COMPARISON_BODIES["expression-objects"], EXPRESSIONS["expression-objects"]),
    "expression-arithmetic": scenario("add, sub, mul, div, mod, round, ceil and floor record the operand a proxy, a number, a string or a list", "expression arithmetic", ARITHMETIC_BODIES["expression-arithmetic"], EXPRESSIONS["expression-arithmetic"]),
    "expression-bits": scenario("band, bor, bxor, bnot and the shifts record the bit stages", "expression bits", ARITHMETIC_BODIES["expression-bits"], EXPRESSIONS["expression-bits"]),
    "expression-text": scenario("split, concat, upcase, downcase, strlen and match record the string stages", "expression text", TEXT_DATE_ARRAY_BODIES["expression-text"], EXPRESSIONS["expression-text"]),
    "expression-dates": scenario("during, the calendar parts and epoch record the date stages, with a timezone stage when one is given", "expression dates", TEXT_DATE_ARRAY_BODIES["expression-dates"], EXPRESSIONS["expression-dates"]),
    "expression-arrays": scenario("index, includes, slice, map, filter, isempty, count, sum, avg, min and max record the array stages", "expression arrays", TEXT_DATE_ARRAY_BODIES["expression-arrays"], EXPRESSIONS["expression-arrays"]),
    "atomic-requests": scenario("atomicMutation refuses every request docs/2.operations/8.atomic_mutations.md excludes, before anything is run", "atomic requests", ATOMIC_BODIES["atomic-requests"], RUNTIME["atomic-requests"]),
    "atomic-execution": scenario("an atomic mutation resolves to applied, not-applied or unknown, refuses any other answer, and is never retried", "atomic execution", ATOMIC_BODIES["atomic-execution"], RUNTIME["atomic-execution"]),
    "query-execution": scenario("await, run and then run a query once each, lazily, and pass the provider's failure on", "query execution", EXECUTION_BODIES["query-execution"], RUNTIME["query-execution"]),
    "query-cursor": scenario("cursor and for await read the provider one result at a time and close the cursor when the consumer stops", "query cursor", EXECUTION_BODIES["query-cursor"], RUNTIME["query-cursor"]),
    "duplicate-key-error": scenario("DuplicateKeyError carries the index and fields, and IsDuplicateKeyError recognises another copy's error", "duplicate key error", KIND_BODIES["duplicate-key-error"], RUNTIME["duplicate-key-error"]),
    "query-kinds": scenario("IsQuery, IsStream, IsDatum and IsValueProxy tell the staged kinds apart, copies of the interface included", "query kinds", KIND_BODIES["query-kinds"], RUNTIME["query-kinds"]),
    "staged-isolation": plain("the build-only entry point loads without interface-core and builds queries that cannot run", "build-only entry", STAGED_SCRIPT, STAGED, "the packed build-only entry point required from a tool"),
    "subpaths": plain("every export subpath resolves through the exports map and names what docs/index.md says", "subpaths", SUBPATH_SCRIPT, SUBPATHS, "each subpath of the packed interface required by its package name"),
    "usage-types": declared("the documented calls resolve to the documented result types", USAGE_TYPES, "every call resolves to its documented type"),
  },
};

export default config;
