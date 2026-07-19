---
name: database-interface
description: Provides AQL (Antelope Query Language), the database-agnostic, chainable, type-safe query builder of AntelopeJS - schemas, tables, CRUD, filtering, joins, aggregation, and change feeds that run identically on any backend module implementing the interface. Use when code imports "@antelopejs/interface-database" (or its /schema, /selection, /stream, /datum, /query, /valueproxy, /common subpaths), when the task mentions AQL, Schema, SchemaInstance, Table, Selection, SingleSelection, Stream, Datum, ValueProxy, or CROSS_INSTANCE, or when asked to define a database schema, query/insert/update/delete documents, or subscribe to change feeds in an AntelopeJS module.
category: antelopejs-interface
tags: [antelopejs, database, query, schema, aql]
---

# Database interface (AQL)

AQL is a lazy, chainable query builder. Every class here (`Schema`, `Table`, `Selection`, `Stream`, `Datum`, `ValueProxy`) is a consumer-side staged object: chaining records stages, nothing touches the database. Apart from schema registration (done once by the `Schema` constructor), the only proxy crossings are execution (`.run()` / `await` / `for await`), which ships the staged query to whatever loaded module implements this interface (e.g. `@antelopejs/mongodb`). Consumers never call `ImplementInterface` for this interface — providing it is the job of database driver modules.

## Imports

```ts
// Root re-exports everything most consumers need:
import { Schema, SchemaInstance, SchemaDefinition, Table, Selection, SingleSelection, Stream, Datum, Query, ValueProxy, ValueProxyOrValue, InstanceId, CROSS_INSTANCE } from "@antelopejs/interface-database";
// Types only available via subpath (not re-exported at root):
import { TableDefinition, IndexDefinition, FieldType } from "@antelopejs/interface-database/schema";
import { Changes, DeepPartial, InsertOptions, Value, ExtractType } from "@antelopejs/interface-database/common";
// Each root symbol is also importable from its own subpath (/schema, /selection, /stream, /datum, /query, /valueproxy) — equivalent alternatives, do not combine with the root import for the same symbol.
```

Add `@antelopejs/interface-database` to the module's `dependencies`; `@antelopejs/interface-core` is a peer dependency.

## Minimal consumption example

```ts
import { Schema } from "@antelopejs/interface-database";

interface User { _id?: string; name: string; age: number; active: boolean; }

// Registers the schema with the provider. The generic maps table names to row types.
const schema = new Schema<{ users: User }>("myapp", {
  users: {
    fields: { name: "string", age: "number", active: "boolean" },
    indexes: { age: {}, active: {} },
  },
});

const users = schema.instance().table("users"); // default instance

const ids = await users.insert({ name: "Ada", age: 36, active: true }); // string[] of inserted ids
const adults = await users
  .filter((u) => u.key("age").ge(18).and(u.key("active")))
  .orderBy("age", "desc");                       // await executes: User[]
await users.get(ids[0]).update({ age: 37 });     // number of modified docs
for await (const change of users.changes()) {    // change feed via async iteration
  console.log(change.changeType, change.newValue); // "added" | "removed" | "modified"
}
```

## Gotchas

- **Lazy everywhere.** No chain call executes anything. Execution happens only via `.run()`, `await` (every `Query` is `PromiseLike`), or async iteration (`for await` / `.cursor()`). This includes `Schema.createInstance()` / `destroyInstance()` / `listInstances()` — they return `Query` objects and do nothing until awaited.
- **Callbacks receive `ValueProxy`, not values.** Functions passed to `filter`, `map`, `do`, `update(fn)`, `join`, `group` are recorded, then replayed by the backend. Only `ValueProxy` methods (`key`, `eq`, `ne`, `gt/ge/lt/le`, `and/or/not`, `add/sub/mul/div`, string/date/array/object helpers, `ValueProxy.constant`) become part of the query — plain JS (`if`, `===`, `Math.*`, template strings) does not travel.
- **Staged objects are immutable.** Each chained call returns a new object; a prefix like `users.getAll(true, "active")` can be safely reused for several derived queries.
- A provider module must be loaded in the project or startup fails with unresolved interface dependencies; queries themselves need no defensive "is the DB ready" checks (calls queue until the provider attaches).
- `Schema` ids are persistent: changing an id leaves previous data inaccessible. `Schema.get(id)` retrieves a previously constructed schema. `instance()` with no argument is the default instance; pass `CROSS_INSTANCE` to query across all instances.
- Field types are string tokens (`"string"`, `"number"`, `"boolean"`, `"date"`, `"string[]"`, nested object literals) or a single io-ts codec at the field root — codecs are not mixed inside string-tree records.
- Range semantics: `Table.between(index, low, high)` and `ValueProxy.during(left, right)` exclude the upper bound.
- `insert` accepts one document or an array, with `{ conflict: "update" | "replace" }` as options; it resolves to the inserted ids.
- `cast<U>()` on `Datum`/`Stream`/`ValueProxy` only changes the TypeScript type — no runtime conversion.
- `update` overloads: pass a plain `DeepPartial<T>` for static values, or a `(val: ValueProxy<T>) => ...` function for computed updates.

## Deeper reference

Full reference lives in the shipped `.d.ts` files (`dist/`) and in the repository's docs tree (https://github.com/AntelopeJS/interface-database/tree/main/docs) — `1.query_types` (Table, Selection, SingleSelection, Stream, Feed, Query, Datum, ValueProxy), `2.operations` (schema management, table operations, CRUD, indexes, filtering, lookup), `3.results` (write results, index/table definitions, change events). Do not duplicate those here.
