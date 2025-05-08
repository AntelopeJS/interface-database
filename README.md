![Database](.github/social-card.png)

# Interface Database

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE.md)
[![Version](https://img.shields.io/badge/version-dev-orange.svg)](https://github.com/antelopejs/antelope)

A database-agnostic query interface that provides consistent operations across different database implementations. Interface Database brings AQL (Antelope Query Language) to your projects, enabling you to write database code that works with multiple database backends.

## Installation

```bash
ajs module imports add database@beta
```

## Documentation

Detailed documentation is available in the `docs` directory:

- [Index](./docs/index.md) - Overview and documentation structure
- [Query Types](./docs/1.query_types/) - Information about table, selection, and other query types
- [Operations](./docs/2.operations/) - Database, table, and CRUD operations
- [Results](./docs/3.results/) - Result types and handling

## Inspiration

Interface Database is heavily inspired by [ReQL](https://rethinkdb.com/docs/introduction-to-reql/), the query language of [RethinkDB](https://rethinkdb.com/). As huge fans of ReQL's elegant chainable API and its ability to express complex queries in a native javascript like language format, we've adopted many of its design principles while expanding the concept to work with multiple database backends.

## Current Status

This is the development version (`beta`) of the Interface Database. It is currently in pre-release stage and may undergo changes before the final release. The interface is not considered stable for production use without understanding that breaking changes may occur.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details.
