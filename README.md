# @antelopejs/interface-database

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/interface-database"><img alt="npm" src="https://img.shields.io/npm/v/@antelopejs/interface-database?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@antelopejs/interface-database?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="https://discord.gg/sjK28QHrA7"><img alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a>
<a href="https://interfaces.antelopejs.com/docs/database"><img alt="Docs" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a>
</div>

AQL (Antelope Query Language), the database-agnostic query builder of AntelopeJS: write a chainable, typed query once and run it on any database module that implements the interface.

## What it offers

- `Schema` declares tables, fields and indexes; each schema can hold several isolated instances.
- `Table`, `Selection` and `SingleSelection` insert, read, update and delete documents.
- `Stream` filters, maps, joins, groups and aggregates; `ValueProxy` builds the expressions inside them.
- `changes()` streams inserts, updates and deletions as they happen.
- Queries are lazy: nothing runs until you `await` them, call `.run()` or iterate them.

## Implementations

| Module                                                             | Notes                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| [`@antelopejs/mongodb`](https://github.com/AntelopeJS/mongodb)     | MongoDB; also implements `@antelopejs/interface-mongodb`     |
| [`@antelopejs/rethinkdb`](https://github.com/AntelopeJS/rethinkdb) | RethinkDB; also implements `@antelopejs/interface-rethinkdb` |

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

Callbacks such as the `filter` above receive a `ValueProxy`, not a document: only its methods travel to the database.

## Documentation

- [Overview and import paths](./docs/index.md)
- [Query types](./docs/1.query_types/1.index.md)
- [Operations](./docs/2.operations/1.index.md)
- [Atomic mutations](./docs/2.operations/8.atomic_mutations.md)
- [Results](./docs/3.results/1.index.md)

## Compatibility

Requires AntelopeJS core `1.x` and the following peer dependency:

<!-- docs-compat: ./package.json#peerDependencies -->

| Package                      | Range            |
| ---------------------------- | ---------------- |
| `@antelopejs/interface-core` | `>=0.2.4 <1.0.0` |

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you open a pull request. The local checks are:

```bash
pnpm install
pnpm lint
pnpm test
```

## License

[Apache-2.0](./LICENSE)
