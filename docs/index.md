# Query data with AQL

## Overview

The Database interface provides AQL (Antelope Query Language), a typed query API for AntelopeJS database providers. Build a query from table access, filters, and transformations, then execute it through the provider bound to your module.

## Run your first query

Start in an AntelopeJS module with a configured database provider. Installing the interface supplies query builders and contracts, not a database server or credentials.

1. [Define a schema and create an instance](./2.operations/2.database_management.md). The schema describes tables; the instance selects where their data lives.
2. [Open a table](./2.operations/3.table_operations.md) and compose a read with [filtering](./2.operations/6.filtering.md). Building the query does not execute it.
3. [Execute with `await` or `run()`](./1.query_types/7.query.md), or consume a cursor for incremental results.
4. [Inspect write results](./3.results/2.write_results.md) when adding mutations. Inserts return IDs; updates and deletes return counts.

### Insert and read one record

Run this function from your module after its database provider is configured. It creates a disposable schema instance and writes one record; do not point this exercise at production data.

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
  await notesSchema.createInstance("tutorial");
  const notes = notesSchema.instance("tutorial").table("notes");
  const [id] = await notes.insert({ title: "Learn AQL", done: false });
  const saved = await notes.get(id);
  if (!saved) throw new Error("The inserted note was not found");
  return saved.title; // "Learn AQL"
}
```

`notes` is a query builder; `saved` is a fetched record. Calling the function again inserts another record. When you no longer need this disposable data, explicitly run `await notesSchema.destroyInstance("tutorial")`; it deletes the instance's data.

## Find the right reference

| Question                                  | Start with                                               |
| ----------------------------------------- | -------------------------------------------------------- |
| Which operations fit this query shape?    | [Query types](./1.query_types/1.index.md)                |
| How do I read and change records?         | [CRUD operations](./2.operations/4.crud.md)              |
| How do I join related data?               | [Lookup](./2.operations/7.lookup.md)                     |
| How do I conditionally change one record? | [Atomic mutations](./2.operations/8.atomic_mutations.md) |
| What did the provider return?             | [Results](./3.results/1.index.md)                        |

## Import Paths

Import `Schema`, `Query`, `Table`, `Datum`, `Stream`, and `ValueProxy` from `@antelopejs/interface-database` in an AntelopeJS module. This entry point registers schemas with the bound provider and installs query execution (`run()`, `then()`, `cursor()`, and async iteration).

Supporting types have dedicated paths: import `Changes`, `DeepPartial`, `ExtractType`, `OperandValue`, `QueryValue`, `Value`, `WriteDocument`, and `WriteValue`, and the `IsQueryValue` guard, from `@antelopejs/interface-database/common`, and `FieldType`, `TableDefinition`, and `IndexDefinition` from `@antelopejs/interface-database/schema`. Atomic mutation types are available from the package root and `/atomic`.

### Advanced: build queries without executing them

`@antelopejs/interface-database/staged-query` is the build-only entry point for tools that construct and inspect query stages without the AntelopeJS runtime. Its schema does not register with a provider, and its queries expose `build()` but no execution methods when loaded on their own. Do not `await` a build-only query expecting database results. The runtime entry point augments the same staged classes; keep build-only consumers separate from runtime imports when that isolation matters.

## Documentation Structure

- [**1. Query Types**](./1.query_types/1.index.md) - Detailed reference for each query type:

  - [Table](./1.query_types/2.table.md) - Table-level operations (insert, get, getAll, between)
  - [Selection](./1.query_types/3.selection.md) - Multi-document operations (update, replace, delete)
  - [SingleSelection](./1.query_types/4.single_selection.md) - Single-document operations
  - [Stream](./1.query_types/5.stream.md) - Transformation, filtering, aggregation, joins, and grouping
  - [Change Feeds](./1.query_types/6.feed.md) - Real-time change notifications
  - [Query](./1.query_types/7.query.md) - Base query execution and async iteration
  - [Datum](./1.query_types/8.datum.md) - Single-value manipulation
  - [ValueProxy](./1.query_types/9.valueproxy.md) - In-query value operations (arithmetic, string, date, array, object)

- [**2. Operations**](./2.operations/1.index.md) - Practical guides:

  - [Schema Management](./2.operations/2.database_management.md) - Create and manage schema instances
  - [Table Operations](./2.operations/3.table_operations.md) - Access and work with tables
  - [CRUD Operations](./2.operations/4.crud.md) - Create, read, update, and delete documents
  - [Index Management](./2.operations/5.indexes.md) - Define and use secondary indexes
  - [Filtering and Querying](./2.operations/6.filtering.md) - Filter, compare, and transform data
  - [Lookup](./2.operations/7.lookup.md) - Foreign key joins and data population
  - [Atomic Mutations](./2.operations/8.atomic_mutations.md) - Conditional single-record mutations and outcomes

- [**3. Results**](./3.results/1.index.md) - Result types and handling:
  - [Insert Results](./3.results/2.write_results.md) - Results from insert operations
  - [Index Definitions](./3.results/3.index_changes.md) - Index configuration in schema definitions
  - [Table Definitions](./3.results/4.table_changes.md) - Table structure and field types
  - [Schema and Instance Management](./3.results/5.database_changes.md) - Schema lifecycle and instance management
  - [Change Events](./3.results/6.value_changes.md) - Change feed event structure

## Features

- Database-agnostic query interface
- Consistent API across different database implementations
- Type-safe operations using TypeScript generics
- Schema-based database structure definition
- Multi-instance support per schema
- Secondary index support
- Change feeds for real-time updates
- Async iteration with cursor support
- Chainable query builder with lazy evaluation

## Database Interoperability

AQL separates query construction from the database engine. A provider translates the shared operations into its backend's behavior. Before moving an application between providers, check that provider's supported operations and exercise the queries, indexes, and change feeds your application uses; a shared TypeScript contract is not a guarantee of identical backend capabilities or performance.
