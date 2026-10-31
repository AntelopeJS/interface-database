const NOTES = `
const notes = new db.Schema("notes", { notes: { fields: { title: "string" }, indexes: {} } });
const table = notes.instance().table("notes");
const attempt = (action) => { try { action(); return "accepted"; } catch (error) { return error.name + ": " + error.message; } };
const mutate = (key, request) => attempt(() => table.atomicMutation(key, request));
const revise = (changes) => ({ type: "update", revisionField: "revision", expectedRevision: "r1", nextRevision: "r2", patch: { title: "T" }, ...changes });
`;

/** Atomic mutation requests: which ones the table refuses before anything reaches a provider, and with what message. */
export const ATOMIC_BODIES = {
  "atomic-requests": `${NOTES}
    const drop = { type: "delete", revisionField: "revision", expectedRevision: "r1" };
    const cycle = { title: "x" };
    cycle.self = cycle;
    const holes = [1, , 3];
    return {
      update: mutate("n-1", revise({})),
      remove: mutate("n-1", drop),
      removeMissingRevision: mutate("n-1", { ...drop, expectedRevision: { kind: "missing" } }),
      updateMissingRevision: mutate("n-1", revise({ expectedRevision: { kind: "missing" } })),
      deleteIfEqual: mutate("n-1", { type: "deleteIfEqual", field: "status", expectedValue: "draft" }),
      deleteIfEqualNumber: mutate("n-1", { type: "deleteIfEqual", field: "n", expectedValue: 3 }),
      deleteIfEqualDate: mutate("n-1", { type: "deleteIfEqual", field: "at", expectedValue: new Date(0) }),
      emptyKey: mutate("", revise({})),
      notRequest: mutate("n-1", null),
      classRequest: mutate("n-1", new (class Custom {})()),
      unknownType: mutate("n-1", { type: "upsert", revisionField: "revision", expectedRevision: "r1" }),
      dottedField: mutate("n-1", revise({ revisionField: "a.b" })),
      operatorField: mutate("n-1", revise({ revisionField: "$set" })),
      identityRevision: mutate("n-1", revise({ revisionField: "_id" })),
      emptyExpected: mutate("n-1", revise({ expectedRevision: "" })),
      nullExpected: mutate("n-1", revise({ expectedRevision: null })),
      looseMissing: mutate("n-1", revise({ expectedRevision: { kind: "missing", extra: 1 } })),
      sameRevision: mutate("n-1", revise({ nextRevision: "r1" })),
      emptyNext: mutate("n-1", revise({ nextRevision: "" })),
      patchIdentity: mutate("n-1", revise({ patch: { _id: "other" } })),
      patchPlainId: mutate("n-1", revise({ patch: { id: "other" } })),
      patchRevision: mutate("n-1", revise({ patch: { revision: "r9" } })),
      patchArray: mutate("n-1", revise({ patch: [1] })),
      patchUndefined: mutate("n-1", revise({ patch: { title: undefined } })),
      patchFunction: mutate("n-1", revise({ patch: { title: () => 1 } })),
      patchNaN: mutate("n-1", revise({ patch: { n: NaN } })),
      patchInfinity: mutate("n-1", revise({ patch: { n: Infinity } })),
      patchBadDate: mutate("n-1", revise({ patch: { at: new Date(NaN) } })),
      patchGoodDate: mutate("n-1", revise({ patch: { at: new Date(0) } })),
      patchCycle: mutate("n-1", revise({ patch: cycle })),
      patchHoles: mutate("n-1", revise({ patch: { list: holes } })),
      patchDottedKey: mutate("n-1", revise({ patch: { "a.b": 1 } })),
      patchOperatorKey: mutate("n-1", revise({ patch: { $inc: 1 } })),
      patchNested: mutate("n-1", revise({ patch: { deep: { list: [1, "a", null, true, new Date(0), { ok: 1 }] } } })),
      patchProxy: mutate("n-1", revise({ patch: { title: db.ValueProxy.constant("x") } })),
      equalIdentity: mutate("n-1", { type: "deleteIfEqual", field: "_id", expectedValue: "n-1" }),
      equalNull: mutate("n-1", { type: "deleteIfEqual", field: "status", expectedValue: null }),
      equalArray: mutate("n-1", { type: "deleteIfEqual", field: "status", expectedValue: ["a"] }),
      equalObject: mutate("n-1", { type: "deleteIfEqual", field: "status", expectedValue: { a: 1 } }),
      equalNaN: mutate("n-1", { type: "deleteIfEqual", field: "n", expectedValue: NaN }),
      equalDotted: mutate("n-1", { type: "deleteIfEqual", field: "a.b", expectedValue: 1 }),
      crossInstance: attempt(() => notes.instance(db.CROSS_INSTANCE).table("notes").atomicMutation("n-1", revise({}))),
      namedInstance: attempt(() => notes.instance("tenant").table("notes").atomicMutation("n-1", revise({}))),
      stages: show(table.atomicMutation("n-1", drop)),
      queryKinds: (() => { const q = table.atomicMutation("n-1", drop); return [db.IsQuery(q), q instanceof db.AtomicMutationQuery, q instanceof db.Query]; })(),
    };
  `,
  "atomic-execution": `${NOTES}
    const drop = { type: "delete", revisionField: "revision", expectedRevision: "r1" };
    const outcomes = {};
    for (const reply of ["applied", "not-applied", "unknown"]) {
      answer = reply;
      outcomes[reply] = await table.atomicMutation("n-1", drop);
    }
    const bad = {};
    for (const [label, reply] of [["undefined", undefined], ["zero", 0], ["count", 1], ["null", null], ["text", "done"], ["object", { applied: true }]]) {
      answer = reply;
      bad[label] = await fails(() => table.atomicMutation("n-1", drop));
    }
    answer = "applied";
    const viaRun = await table.atomicMutation("n-1", drop).run();
    const cursor = await fails(() => table.atomicMutation("n-1", drop).cursor());
    const iterate = await fails(async () => { for await (const item of table.atomicMutation("n-1", drop)) return item; });
    seen.runs.length = 0;
    answer = new Error("link lost");
    const lost = await fails(() => table.atomicMutation("n-1", drop));
    const callsAfterLoss = seen.runs.length;
    answer = "applied";
    seen.runs.length = 0;
    await table.atomicMutation("n-1", drop);
    const terminal = seen.runs[0];
    return {
      outcomes, bad, viaRun, cursor, iterate, lost, callsAfterLoss,
      canonical: [show(terminal), terminal.length, terminal.at(-1).stage, terminal.at(-1).options === undefined, terminal.at(-1).args.length],
      unsupported: [(() => { const e = new db.AtomicMutationUnsupportedError(); return [e.name, e.message, e instanceof Error]; })()],
    };
  `,
} satisfies { [id: string]: string };

/** Query execution: await, run, then, cursor and async iteration reach the provider as documented. */
export const EXECUTION_BODIES = {
  "query-execution": `${NOTES}
    answer = [{ title: "A" }];
    const built = table.filter((n) => n.key("title").eq("A"));
    const lazy = seen.runs.length;
    const viaAwait = await built;
    const viaRun = await built.run();
    const viaThen = await new Promise((resolve) => built.then(resolve));
    const viaThenChain = await built.then((rows) => rows.length);
    const sameStages = seen.runs.every((stages) => JSON.stringify(show(stages)) === JSON.stringify(show(built)));
    answer = new Error("provider refused");
    const rejected = await fails(() => built);
    const caught = await built.then(undefined, (error) => "handled:" + error.message);
    const onRejected = await built.run().catch((error) => "caught:" + error.message);
    return { lazy, viaAwait, viaRun, viaThen, viaThenChain, runs: seen.runs.length, sameStages, rejected, caught, onRejected, methods: ["run", "then", "cursor"].map((name) => typeof built[name]), iterator: typeof built[Symbol.asyncIterator] };
  `,
  "query-cursor": `${NOTES}
    readAnswers = [{ done: false, value: { n: 1 } }, { done: false, value: { n: 2 } }, { done: true, value: undefined }];
    const items = [];
    for await (const item of table) items.push(item);
    const firstLoop = { items, reads: seen.reads.map(([id, stages]) => [id, show(stages).slice(3)]) };
    readAnswers = [{ done: false, value: "x" }, { done: false, value: "y" }];
    for await (const item of table) { break; }
    const afterBreak = { reads: seen.reads.length, closes: [...seen.closes] };
    readAnswers = [{ done: false, value: "m" }];
    const manual = table.cursor();
    const first = await manual.next();
    const returned = await manual.return();
    const stopped = { first, returned, closes: [...seen.closes] };
    const generatorLike = [typeof manual.next, typeof manual.return, typeof manual.throw, manual[Symbol.asyncIterator]() === manual];
    const thrown = table.cursor();
    const thrownResult = await thrown.throw(new Error("stop"));
    return { firstLoop, afterBreak, stopped, generatorLike, thrownResult, closesAfterThrow: [...seen.closes] };
  `,
} satisfies { [id: string]: string };

/** Duplicate key errors and the kind predicates, which recognise another copy of the interface. */
export const KIND_BODIES = {
  "duplicate-key-error": `
    const error = new db.DuplicateKeyError("email", ["email"]);
    const compound = new db.DuplicateKeyError("_id", ["_id"]);
    const marker = Symbol.for("@antelopejs/interface-database/DuplicateKeyError@1");
    const foreign = Object.defineProperty(new Error("from another copy"), marker, { value: true });
    const lookalike = Object.assign(new Error("Duplicate key"), { index: "_id", fields: ["_id"] });
    return {
      shape: [error.name, error.message, error.index, error.fields, error instanceof Error, error instanceof db.DuplicateKeyError],
      primary: [compound.index, compound.message],
      known: [db.IsDuplicateKeyError(error), db.IsDuplicateKeyError(foreign), db.IsDuplicateKeyError(lookalike), db.IsDuplicateKeyError(new Error("x")), db.IsDuplicateKeyError(null), db.IsDuplicateKeyError(undefined), db.IsDuplicateKeyError("DuplicateKeyError"), db.IsDuplicateKeyError({})],
      markerHidden: Object.keys(error).includes(String(marker)) || Object.getOwnPropertySymbols(error).length,
    };
  `,
  "query-kinds": `${NOTES}
    const row = db.ValueProxy.arg(0);
    const marks = (name, value) => [name, db.IsQuery(value), db.IsStream(value), db.IsDatum(value), db.IsValueProxy(value)];
    const forge = (name) => Object.defineProperty({}, Symbol.for("@antelopejs/interface-database/" + name + "@1"), { value: true });
    return {
      table: marks("table", table),
      filtered: marks("filtered", table.filter((n) => n.key("title").eq("A"))),
      single: marks("single", table.get("n-1")),
      count: marks("count", table.count()),
      key: marks("key", table.key("title")),
      insert: marks("insert", table.insert({})),
      atomic: marks("atomic", table.atomicMutation("n-1", { type: "delete", revisionField: "revision", expectedRevision: "r1" })),
      proxy: marks("proxy", row.key("title")),
      constant: marks("constant", db.ValueProxy.constant(1)),
      plain: marks("plain", {}),
      nothing: marks("nothing", null),
      text: marks("text", "Stream"),
      forged: [marks("forgedQuery", forge("Query")), marks("forgedStream", forge("Stream")), marks("forgedDatum", forge("Datum")), marks("forgedProxy", forge("ValueProxy"))],
      chain: [table instanceof db.Table, table instanceof db.Selection, table instanceof db.Stream, table instanceof db.Query, table.get("a") instanceof db.SingleSelection, table.get("a") instanceof db.Datum, table.get("a") instanceof db.Stream, table.count() instanceof db.Datum, row instanceof db.Query],
    };
  `,
} satisfies { [id: string]: string };
