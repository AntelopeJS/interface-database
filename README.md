![Database](.github/social-card.png)

# Interface Database

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/interface-database"><img src="https://img.shields.io/npm/v/@antelopejs/interface-database?style=for-the-badge&labelColor=000000&color=000000" alt="npm"></a>
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/sjK28QHrA7"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000" alt="Discord"></a>
<a href="./docs/index.md"><img src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000" alt="Documentation"></a>
</div>

A database-agnostic query interface that provides consistent operations across different database implementations. Interface Database brings AQL (Antelope Query Language) to your projects, enabling you to write database code that works seamlessly with multiple database backends through a chainable, type-safe API inspired by ReQL.

## Installation

```bash
npm install @antelopejs/interface-database
```

## Documentation

Detailed documentation is available in the `docs` directory:

- [Overview](./docs/index.md) - Introduction and documentation structure
- [Query Types](./docs/1.query_types/1.index.md) - Table, Selection, Stream, Datum, ValueProxy, and other query types
- [Operations](./docs/2.operations/1.index.md) - Schema management, CRUD operations, filtering, and lookups
- [Results](./docs/3.results/1.index.md) - Result types and change feed handling

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
