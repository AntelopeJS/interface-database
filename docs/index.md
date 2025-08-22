# Database Interface

## Overview

The Database interface brings AQL (Antelope Query Language) which aims to be database agnostic. Each module can implement this generic interface with the database they want. As the community continues making modules for this interface, we aim to have all the most popular databases working behind this common API.

## Documentation Structure

This documentation is organized into the following sections:

- [**1. Query Types**](./1.query_types/1.index.md) - Detailed information about the various query types:

  - [2. Table](./1.query_types/2.table.md) - Table operations
  - [3. Selection](./1.query_types/3.selection.md) - Working with multiple documents
  - [4. SingleSelection](./1.query_types/4.single_selection.md) - Working with a single document
  - [5. Stream](./1.query_types/5.stream.md) - Stream operations
  - [6. Feed](./1.query_types/6.feed.md) - Change feeds and live updates
  - [7. Query](./1.query_types/7.query.md) - Change feeds and live updates
  - [8. Datum](./1.query_types/8.datum.md) - Working with single values

- [**2. Operations**](./2.operations/1.index.md) - Common operations:

  - [2. Database Management](./2.operations/2.database_management.md) - Creating, listing, and dropping databases
  - [3. Table Operations](./2.operations/3.table_operations.md) - Creating, listing, and dropping tables
  - [4. CRUD Operations](./2.operations/4.crud.md) - Create, read, update, and delete documents
  - [5. Index Management](./2.operations/5.indexes.md) - Creating and using indexes
  - [6. Filtering and Querying](./2.operations/6.filtering.md) - Filtering documents and querying data

- [**3. Results**](./3.results/1.index.md) - Result types and handling:
  - [2. Write Results](./3.results/2.write_results.md) - Results from write operations
  - [3. Index Changes](./3.results/3.index_changes.md) - Results from index operations
  - [4. Table Changes](./3.results/4.table_changes.md) - Results from table operations
  - [5. Database Changes](./3.results/5.database_changes.md) - Results from database operations
  - [6. Value Changes](./3.results/6.value_changes.md) - Change feed notifications

## Features

- Database-agnostic query interface
- Consistent API across different database implementations
- Table management (create, list, drop)
- CRUD operations for documents
- Index management
- Change feeds
- Type-safe operations using TypeScript

## Database Interoperability

One of the key advantages of using the AQL interface is that your application code remains the same even if you switch the underlying database implementation. For example, the same code could work with:

- RethinkDB
- MongoDB
- Other databases with community-provided implementations

This makes your application more flexible and reduces the cost of migrating between database systems.
