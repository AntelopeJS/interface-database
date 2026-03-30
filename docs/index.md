# Database Interface

## Overview

The Database interface provides AQL (Antelope Query Language), a database-agnostic query API. Each module implements this generic interface with the database engine of its choice. AQL offers a chainable, type-safe query builder that works identically across all supported backends, so your application code remains portable regardless of the underlying database.

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

AQL decouples your application logic from the database engine. The same query code works with any backend that implements the interface, such as MongoDB, RethinkDB, or other community-provided implementations. This reduces migration cost and keeps your code portable.
