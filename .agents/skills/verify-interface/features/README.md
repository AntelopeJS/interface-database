# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, `journeys:` the journeys it runs, and `seeded-breaks/<feature>.patch` the break its journeys must catch. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered.

| Feature | What the user does | Journeys |
|---|---|---|
| [smoke](smoke.md) | The fixed journey every verdict runs: pack the interface, load it in `ajs project dev` with a stub provider and a consumer, and call the proxies a database module implements (`RunQuery`, `ReadCursor`, `CloseCursor`) and the schema registry. | through-core |
| [schemas](schemas.md) | A module defines a `Schema`, which registers with the bound provider, then picks an instance, a table, or creates and destroys named instances. | schema-registry, schema-stages, schema-run |
| [tables-read](tables-read.md) | A table is read whole, by primary key (`get`), by secondary index (`getAll`) or by range (`between`, low bound included, high bound excluded). | table-reads |
| [tables-write](tables-write.md) | A module inserts (with `conflict: "update"` or `"replace"`), updates with a partial document or a computed function, replaces, deletes and subscribes to changes. | table-writes, table-results |
| [streams](streams.md) | A stream is mapped, filtered, plucked, ordered, sliced and aggregated. | stream-shape, stream-order, stream-aggregates, stream-run |
| [joins](joins.md) | A stream is joined to another (left or inner), looked up through a foreign key, or grouped by an index. | join-stages, group-stages |
| [datums](datums.md) | A single document or value is read, a field is picked, defaulted, transformed with `do`, looked up or plucked. | datum-stages, datum-run |
| [expressions-logic](expressions-logic.md) | Inside a query callback a `ValueProxy` compares, combines and reads fields: `eq`, `ne`, `and`, `or`, `not`, `gt` to `le`, `default`, `key`, `merge`, `keys`, `values`, `hasfields`. | expression-logic, expression-objects |
| [expressions-arithmetic](expressions-arithmetic.md) | Inside a query callback a number is added to, subtracted from, multiplied, divided, rounded and combined bitwise. | expression-arithmetic, expression-bits |
| [expressions-text](expressions-text.md) | Inside a query callback a string is split, concatenated, case-folded, measured and matched against a regular expression. | expression-text |
| [expressions-dates](expressions-dates.md) | Inside a query callback a date is tested against a range, broken into calendar parts in an optional timezone, or turned into epoch seconds. | expression-dates |
| [expressions-arrays](expressions-arrays.md) | Inside a query callback a list is indexed, searched, sliced, mapped, filtered, counted and reduced. | expression-arrays |
| [atomic-requests](atomic-requests.md) | A module asks for one conditional change of one record: update or delete under a revision, or delete when one field still equals what was observed. | atomic-requests |
| [atomic-execution](atomic-execution.md) | Awaiting an atomic mutation resolves to `applied`, `not-applied` or `unknown`; any other provider answer is an `AtomicMutationUnsupportedError`; cursors are refused; nothing is retried. | atomic-execution |
| [execution](execution.md) | A query is lazy; `await`, `run()` and `then()` run it once, `cursor()` and `for await` read it one result at a time and close the cursor when the consumer stops. | query-execution, query-cursor |
| [duplicate-key](duplicate-key.md) | A write that repeats a unique key rejects with a `DuplicateKeyError` naming the index and its fields; `IsDuplicateKeyError` also recognises the error of another copy of the interface. | duplicate-key-error |
| [kinds](kinds.md) | `IsQuery`, `IsStream`, `IsDatum` and `IsValueProxy` tell what a value is, including a value built by another copy of the interface, which `instanceof` cannot. | query-kinds |
| [staged-query](staged-query.md) | A build tool imports `@antelopejs/interface-database/staged-query`, builds queries and reads `build()`; the entry point never loads `interface-core` or `node:async_hooks`, its queries cannot run, and the root entry later gives the same classes `run`, `then` and `cursor`. | staged-isolation |
| [entry-points](entry-points.md) | A module imports from the root entry or from one of the subpaths the exports map lists; `typesVersions` lists the same subpaths for older resolvers. | subpaths |
| [types](types.md) | A TypeScript module sees the documented result type of each call, the table names of its schema, and the values `getAll`, `between`, `insert` and `atomicMutation` accept and refuse. | usage-types |
