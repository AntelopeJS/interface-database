---
title: Query data with AQL
description: Define a schema, run a first AQL query from an AntelopeJS module, and find the reference page for each query type, operation, and result.
mode: how-to
---

## Overview

The Database interface provides AQL (Antelope Query Language), a typed query API for AntelopeJS database providers. You build a query from table access, filters, and transformations, then execute it through the provider bound to your module.

## Run your first query

Start in an AntelopeJS module with a configured database provider. The interface package supplies query builders and contracts. It does not supply a database server or credentials.

1. [Define a schema and create an instance](./2.operations/2.database_management.md). The schema describes tables, and the instance selects where their data lives.
2. [Open a table](./2.operations/3.table_operations.md) and compose a read with [filtering](./2.operations/6.filtering.md). Building the query does not execute it.
3. [Execute the query with `run()`](./1.query_types/7.query.md), or consume a cursor for incremental results.
4. [Inspect write results](./3.results/2.write_results.md) when you add mutations. Inserts return IDs. Updates and deletes return counts.

### Insert and read one record

Run this function from your module after its database provider is configured. It creates a disposable schema instance and writes one record. Do not point it at production data.

```ts docs-check
import { Schema } from "@antelopejs/interface-database";

interface Note {
  _id: string;
  title: string;
  done: boolean;
}

const notesSchema = new Schema<{ notes: Note }>("notes-demo", {
  notes: {
    fields: { title: "string", done: "boolean" },
    indexes: {},
  },
});

export async function tryNotes() {
  await notesSchema.createInstance("tutorial").run();
  const notes = notesSchema.instance("tutorial").table("notes");
  const [id] = await notes.insert({ title: "Learn AQL", done: false }).run();
  const saved = await notes.get(id).run();
  if (!saved) throw new Error("The inserted note was not found");
  return saved.title; // "Learn AQL"
}
```

`notes` is a query builder, and `saved` is a fetched record. Each call of the function inserts another record. To delete the instance and its data when you no longer need them, run `await notesSchema.destroyInstance("tutorial").run()`.

## Find the right reference

| Question                                  | Start with                                               |
| ----------------------------------------- | -------------------------------------------------------- |
| Which operations fit this query shape?    | [Query types](./1.query_types/1.index.md)                |
| How do I read and change records?         | [CRUD operations](./2.operations/4.crud.md)              |
| How do I join related data?               | [Lookup](./2.operations/7.lookup.md)                     |
| How do I conditionally change one record? | [Atomic mutations](./2.operations/8.atomic_mutations.md) |
| What did the provider return?             | [Results](./3.results/1.index.md)                        |

## Import paths

Import `Schema`, `Query`, `Table`, `Datum`, `Stream`, and `ValueProxy` from `@antelopejs/interface-database` in an AntelopeJS module. This entry point registers schemas with the bound provider and installs query execution: `run()`, `cursor()`, and async iteration.

Supporting types have their own paths:

- `@antelopejs/interface-database/common` exports `Changes`, `DeepPartial`, `ExtractType`, `OperandValue`, `QueryValue`, `Value`, `WriteDocument`, and `WriteValue`.
- `@antelopejs/interface-database/schema` exports `FieldType`, `TableDefinition`, and `IndexDefinition`.
- The package root and `@antelopejs/interface-database/atomic` both export the atomic mutation types.

### Build queries without executing them

`@antelopejs/interface-database/staged-query` is the build-only entry point for tools that construct and inspect query stages without the AntelopeJS runtime. Its schema does not register with a provider. Loaded on their own, its queries expose `build()` and no execution methods. The runtime entry point adds execution to the same staged classes. If a build-only consumer must stay isolated from execution, keep it apart from code that imports the runtime entry point.

## Documentation structure

- [Query types](./1.query_types/1.index.md) is the reference for each query type:
  - [Table](./1.query_types/2.table.md) covers table-level operations: `insert`, `get`, `getAll`, `between`, and `atomicMutation`.
  - [Selection](./1.query_types/3.selection.md) covers multi-document operations: `update`, `replace`, and `delete`.
  - [SingleSelection](./1.query_types/4.single_selection.md) covers single-document operations.
  - [Stream](./1.query_types/5.stream.md) covers transformation, filtering, aggregation, joins, and grouping.
  - [Change feeds](./1.query_types/6.feed.md) covers real-time change notifications.
  - [Query](./1.query_types/7.query.md) covers base query execution and async iteration.
  - [Datum](./1.query_types/8.datum.md) covers single-value manipulation.
  - [ValueProxy](./1.query_types/9.valueproxy.md) covers in-query value operations on numbers, strings, dates, arrays, and objects.
- [Operations](./2.operations/1.index.md) holds the practical guides:
  - [Schema management](./2.operations/2.database_management.md) creates and manages schema instances.
  - [Table operations](./2.operations/3.table_operations.md) opens tables and works with them.
  - [CRUD operations](./2.operations/4.crud.md) creates, reads, updates, and deletes documents.
  - [Index management](./2.operations/5.indexes.md) defines and uses secondary indexes.
  - [Filtering and querying](./2.operations/6.filtering.md) filters, compares, and transforms data.
  - [Lookup](./2.operations/7.lookup.md) joins on foreign keys and populates data.
  - [Atomic mutations](./2.operations/8.atomic_mutations.md) covers conditional single-record mutations and their outcomes.
- [Results](./3.results/1.index.md) describes result types and how to handle them:
  - [Insert results](./3.results/2.write_results.md) describes what insert operations return.
  - [Index definitions](./3.results/3.index_changes.md) describes index configuration in schema definitions.
  - [Table definitions](./3.results/4.table_changes.md) describes table structure and field types.
  - [Schema and instance management](./3.results/5.database_changes.md) describes the schema lifecycle and instance management.
  - [Change events](./3.results/6.value_changes.md) describes the structure of a change feed event.

## Features

- A query interface that does not depend on one database.
- One API across database implementations.
- Typed operations through TypeScript generics.
- Database structure defined by a schema.
- Several instances per schema.
- Secondary indexes.
- Change feeds for real-time updates.
- Async iteration with cursors.
- A chainable query builder with lazy evaluation.

## Database interoperability

AQL separates query construction from the database engine. A provider translates the shared operations into its backend's behavior. A shared TypeScript contract does not guarantee identical backend capabilities or performance. Before you move an application to another provider, check which operations that provider supports, and test the queries, indexes, and change feeds your application uses.
