<a href="https://github.com/AntelopeJS/antelopejs"><img data-illustration src="./.github/readme/strip.svg" width="100%" alt="INTERFACE · DATABASE: part of AntelopeJS, hexagonal architecture beyond your own code. A glowing button reads Star AntelopeJS."></a>

<div align="center">

# `@antelopejs/interface-database`

<a href="https://www.npmjs.com/package/@antelopejs/interface-database"><img data-illustration alt="npm" src="https://img.shields.io/npm/v/@antelopejs/interface-database?style=for-the-badge&labelColor=000000&color=000000"></a> <a href="./LICENSE"><img data-illustration alt="License" src="https://img.shields.io/npm/l/@antelopejs/interface-database?style=for-the-badge&labelColor=000000&color=000000"></a> <a href="https://discord.gg/g4pFt6eXqu"><img data-illustration alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a> <a href="https://interfaces.antelopejs.com/docs/database"><img data-illustration alt="Docs" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a> <a href="https://github.com/AntelopeJS/antelopejs"><img data-illustration alt="Star AntelopeJS" src="https://img.shields.io/github/stars/AntelopeJS/antelopejs?label=Star%20AntelopeJS&style=for-the-badge&labelColor=000000&color=000000&logo=github"></a>

**AQL, the AntelopeJS database query builder. Write a typed query once and run it on the database module your project loads.**

[Documentation](https://interfaces.antelopejs.com/docs/database) · [Implementations](#implementations) · [All interfaces and providers](https://github.com/AntelopeJS/antelopejs#ecosystem)

</div>

AQL (Antelope Query Language) is the database-agnostic query builder of AntelopeJS. You write a chainable, typed query once, and any database module that implements the interface runs it.

## What it offers

- `Schema` declares tables, fields and indexes. Each schema can hold several isolated instances.
- `Table`, `Selection` and `SingleSelection` insert, read, update and delete documents.
- `Stream` filters, maps, joins, groups and aggregates. `ValueProxy` builds the expressions inside them.
- `changes()` streams inserts, updates and deletions as they happen.
- Queries are lazy. Nothing runs until you `await` a query, call `.run()` or iterate it.

## Implementations

| Module                                                             | Notes                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [`@antelopejs/mongodb`](https://github.com/AntelopeJS/mongodb)     | MongoDB. Also implements `@antelopejs/interface-mongodb`.     |
| [`@antelopejs/rethinkdb`](https://github.com/AntelopeJS/rethinkdb) | RethinkDB. Also implements `@antelopejs/interface-rethinkdb`. |

## Install

Add the interface to the module that runs queries:

```bash
pnpm add @antelopejs/interface-database
```

Then add an implementation to the project:

```bash
ajs project modules add @antelopejs/mongodb
```

## Quick start

```ts
import { Schema } from "@antelopejs/interface-database";

interface Novel {
  _id?: string;
  title: string;
  pageCount: number;
}

const schema = new Schema<{ novels: Novel }>("library", {
  novels: {
    fields: { title: "string", pageCount: "number" },
    indexes: { pageCount: {} },
  },
});

const novels = schema.instance().table("novels");

export async function addNovel(title: string, pageCount: number) {
  return await novels.insert({ title, pageCount });
}

export async function listLongNovels() {
  return await novels
    .filter((novel) => novel.key("pageCount").ge(300))
    .orderBy("pageCount", "desc");
}
```

Callbacks such as the `filter` above receive a `ValueProxy`, not a document. The callback runs once, when the query is built, and the query records only the `ValueProxy` calls it makes.

## Documentation

- [Overview and import paths](./docs/index.md)
- [Query types](./docs/1.query_types/1.index.md)
- [Operations](./docs/2.operations/1.index.md)
- [Atomic mutations](./docs/2.operations/8.atomic_mutations.md)
- [Results](./docs/3.results/1.index.md)

## Compatibility

The package declares this `@antelopejs/*` peer dependency:

<!-- antelopejs-docs-compat:start -->

| Package                      | Supported        | Tested with |
| ---------------------------- | ---------------- | ----------- |
| `@antelopejs/interface-core` | `>=0.2.4 <1.0.0` | `0.4.0`     |

<!-- antelopejs-docs-compat:end -->

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you open a pull request. The local checks are:

```bash
pnpm install
pnpm lint
pnpm test
```

## Part of AntelopeJS

[AntelopeJS](https://github.com/AntelopeJS/antelopejs) is a TypeScript framework where modules depend on contracts and the application chooses the provider behind each one. [AntelopeJS DMS](https://github.com/AntelopeJS/dms), the open-source back office, is built on it.

<!-- antelopejs-framework-modules:start -->

| Area         | Contracts                                                                                                                                                                                                                                                                                                                                                                  | Providers                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API          | [`interface-api`](https://github.com/AntelopeJS/interface-api) · [`interface-api-util`](https://github.com/AntelopeJS/interface-api-util) · [`interface-data-api`](https://github.com/AntelopeJS/interface-data-api)                                                                                                                                                       | [`api`](https://github.com/AntelopeJS/api)                                                                                                                                                                                                          |
| Auth         | [`interface-auth`](https://github.com/AntelopeJS/interface-auth)                                                                                                                                                                                                                                                                                                           | [`auth-jwt`](https://github.com/AntelopeJS/auth-jwt)                                                                                                                                                                                                |
| Database     | **`interface-database`** · [`interface-database-decorators`](https://github.com/AntelopeJS/interface-database-decorators) · [`interface-database-catalog`](https://github.com/AntelopeJS/interface-database-catalog) · [`interface-mongodb`](https://github.com/AntelopeJS/interface-mongodb) · [`interface-rethinkdb`](https://github.com/AntelopeJS/interface-rethinkdb) | [`postgres`](https://github.com/AntelopeJS/postgres) · [`mongodb`](https://github.com/AntelopeJS/mongodb) · [`rethinkdb`](https://github.com/AntelopeJS/rethinkdb)                                                                                  |
| Redis        | [`interface-redis`](https://github.com/AntelopeJS/interface-redis) · [`interface-redis-scheduler`](https://github.com/AntelopeJS/interface-redis-scheduler)                                                                                                                                                                                                                | [`redis`](https://github.com/AntelopeJS/redis)                                                                                                                                                                                                      |
| Email        | [`interface-email`](https://github.com/AntelopeJS/interface-email)                                                                                                                                                                                                                                                                                                         | [`nodemailer`](https://github.com/AntelopeJS/nodemailer) · [`brevo`](https://github.com/AntelopeJS/brevo)                                                                                                                                           |
| File storage | [`interface-file-storage`](https://github.com/AntelopeJS/interface-file-storage)                                                                                                                                                                                                                                                                                           | [`file-storage-local`](https://github.com/AntelopeJS/file-storage-local) · [`file-storage-s3`](https://github.com/AntelopeJS/file-storage-s3)                                                                                                       |
| Payments     | [`interface-payment`](https://github.com/AntelopeJS/interface-payment) · [`interface-subscriptions`](https://github.com/AntelopeJS/interface-subscriptions) · [`interface-stripe`](https://github.com/AntelopeJS/interface-stripe)                                                                                                                                         | [`stripe`](https://github.com/AntelopeJS/stripe) · [`mollie`](https://github.com/AntelopeJS/mollie) · [`checkout-com`](https://github.com/AntelopeJS/checkout-com) · [`payment-subscriptions`](https://github.com/AntelopeJS/payment-subscriptions) |

<!-- antelopejs-framework-modules:end -->

## License

[Apache-2.0](./LICENSE)
