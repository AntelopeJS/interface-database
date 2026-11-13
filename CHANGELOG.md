# Changelog

## v0.4.0

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.3.3...v0.4.0)

### Upgrade notes

- **A query is no longer a promise.** `Query` has no `then()`, and `QueryExecution` no longer extends `PromiseLike`. `await query` gives back the query object and sends nothing to the provider. Run a query with `run()`, or read it with `cursor()` or `for await`. A query in `Promise.all([...])`, or returned from an `async` function, is no longer run either. TypeScript rejects a query passed where a `PromiseLike` is expected, and the `typescript/await-thenable` lint rule reports `await` on a query and a query passed to `Promise.all`, `Promise.race` or another promise aggregator. The conformance suite in `dist/tests` runs every query with `run()`. A database module implements nothing new.

  ```ts
  // Before
  const adults = await users.filter((u) => u.key("age").ge(18));
  // After
  const adults = await users.filter((u) => u.key("age").ge(18)).run();
  ```

- **`cast()` returns a new object.** `Datum#cast`, `Stream#cast` and `ValueProxy#cast` return a new object with the same stages, built by the new `StagedObject` constructor form `new X(undefined, previous)`, which records no stage. `cast()` on a `Table`, a `Selection` or a `SingleSelection` returns a plain `Stream` or `Datum`, the class its type already declared. Code that compared the result with its receiver, or relied on it keeping the subclass methods at runtime, such as a table's `insert` or `getAll`, keeps the receiver instead.

  ```ts
  // Before: the same object, still a Table at runtime
  table.cast<Row>() === table; // true
  // After: a new Stream with the same stages
  table.cast<Row>() === table; // false
  table.cast<Row>().build(); // equal to table.build()
  ```

- **`Schema.get()` takes no type arguments.** The registry keeps none, so `Schema.get(id)` returns `Schema<any, unknown> | undefined`: tables hold `any` documents, and the definition is typed `unknown`. A typed lookup such as `Schema.get<{ users: User }>(id)` fails to compile (TS2558). Query typed tables through the schema object the constructor returned. On the runtime entry, `Schema.list().get(id)` returns the schema with its definition typed `SchemaDefinition`.

  ```ts
  // Before
  const schema = Schema.get<{ users: User }>("myapp")!;
  // After: export the schema you define, and import it
  export const schema = new Schema<{ users: User }>("myapp", definition);
  ```

- **The build-only `Query<T>` keeps its result type.** Loaded from `@antelopejs/interface-database/staged-query` alone, `Query<T>` now uses `T`, so `ExtractType` reads the result type of a `Datum` or a `Stream` a mapper returns, and a `Query<string>` is no longer assignable to a `Query<number>`. Code that relied on that assignment fails to compile.

  ```ts
  // Before, build-only entry: compiled, typed unknown
  const q: Query<number> = schema.createInstance(); // Query<string>
  // After: TS2322
  ```

- **`StagedObject#callfunc` checks its argument classes.** The protected method takes one or two `StagedConstructor`s, and each must build the parameter type `func` declares. A subclass that passed `ValueProxy<unknown>` for a parameter typed `ValueProxy<T>` passes `ValueProxy<T>`.

  ```ts
  // Before
  this.callfunc(mapper, Stream<T>, ValueProxy<unknown>);
  // After
  this.callfunc(
    mapper,
    Stream<T>,
    ValueProxy<K extends keyof T ? T[K] : unknown>,
  );
  ```

### 🚀 Enhancements

- **staged-query:** ⚠️  Drop casts, thenable queries and caller-typed schema lookups ([#91](https://github.com/AntelopeJS/interface-database/pull/91))

### 💅 Refactors

- **tests:** Drop the no-unused-expressions suppression ([#88](https://github.com/AntelopeJS/interface-database/pull/88))

### 📖 Documentation

- **readme:** List the mysql and postgres backends among the implementations ([#89](https://github.com/AntelopeJS/interface-database/pull/89))

### ✅ Tests

- **atomic:** Move off-contract refusal checks into an untyped spec ([#90](https://github.com/AntelopeJS/interface-database/pull/90))

### 🤖 CI

- **release:** Accept an exact release-version on dispatch ([#92](https://github.com/AntelopeJS/interface-database/pull/92))

#### ⚠️ Breaking Changes

- **staged-query:** ⚠️  Drop casts, thenable queries and caller-typed schema lookups ([#91](https://github.com/AntelopeJS/interface-database/pull/91))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.3.3

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.3.2...v0.3.3)

### 🚀 Enhancements

- **staged-query:** Read dotted index fields, orderBy names and lookup keys as nested paths ([#87](https://github.com/AntelopeJS/interface-database/pull/87))

### 📖 Documentation

- **readme:** Adopt the AntelopeJS framework README style ([#86](https://github.com/AntelopeJS/interface-database/pull/86))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.3.2

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.3.1...v0.3.2)

### 🩹 Fixes

- **verify:** Cover the stage recorder in every feature that records stages ([#79](https://github.com/AntelopeJS/interface-database/pull/79))
- **selection:** Accept a getAll key proxy of any SelectionKey type ([#80](https://github.com/AntelopeJS/interface-database/pull/80))

### 📖 Documentation

- **schema:** State that a refused registration fails the schema's queries ([#81](https://github.com/AntelopeJS/interface-database/pull/81))
- **changelog:** Upgrade notes of interface-database 0.3.0 ([#84](https://github.com/AntelopeJS/interface-database/pull/84))

### 📦 Build

- **deps:** Bump @antelopejs packages to the 2026-11-06 releases ([#78](https://github.com/AntelopeJS/interface-database/pull/78))
- **deps:** Bump @antelopejs/tooling-configs to 0.4.0 ([#82](https://github.com/AntelopeJS/interface-database/pull/82))
- **deps:** Bump @antelopejs/tooling-configs to 0.5.0 ([#83](https://github.com/AntelopeJS/interface-database/pull/83))
- **deps:** Bump @antelopejs/tooling-configs to 0.5.1 ([#85](https://github.com/AntelopeJS/interface-database/pull/85))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.3.1

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.3.0...v0.3.1)

### 🩹 Fixes

- **skills:** Route decorator table classes away from database-interface ([#75](https://github.com/AntelopeJS/interface-database/pull/75))

### 📖 Documentation

- **readme:** Link the package to AntelopeJS and AntelopeJS DMS ([afac09f](https://github.com/AntelopeJS/interface-database/commit/afac09f))

### 🏡 Chore

- **verify:** Remove seeded runs from the verification skill ([#74](https://github.com/AntelopeJS/interface-database/pull/74))
- **ci:** Remove the weekly mutation caller ([#76](https://github.com/AntelopeJS/interface-database/pull/76))

### 🤖 CI

- Call ci-node.yml@v1 ([#77](https://github.com/AntelopeJS/interface-database/pull/77))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.3.0

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.2.0...v0.3.0)

### Upgrade notes

- **`update()` with an `any`-typed argument resolves to `never`.** Reading its result, for example `.run()`, fails to compile (TS2339). A function argument still matches only the updater overload and an object argument only the document overload, so typed calls are unchanged. Unchecked `any` writes become compile errors. `ReturnType<typeof table.update>` is now `Query<number>`, so `await ...run()` is a `number` instead of `any` ([#65](https://github.com/AntelopeJS/interface-database/pull/65)).
- **The entries of a `FieldType` codec are typed `unknown`.** `IoTsCodec` is now a type alias with the same members, so `Object.entries` on a codec gives `[string, unknown]` instead of `[string, any]`. A consumer that passed those entries on as `FieldType` stops compiling. Narrow each entry first. Every value assignable to `FieldType` before still is ([#63](https://github.com/AntelopeJS/interface-database/pull/63)).
- **Stage operands are checked as query values.** A generic `T` operand, or a class instance with methods such as `ObjectId`, no longer compiles as a stage operand. Neither does an operand that holds a `bigint`, a `symbol`, a function or a value typed `unknown`. `eq`, `ne`, `gt`, `ge`, `lt`, `le` and `includes` check their operand against the receiver's type. `constant`, `default`, `sub`, `merge` and the default of `key` refuse an `interface`-typed record: declare it with `type`. A generic `K extends keyof T` no longer compiles as a `ValueProxy.key`. `any` stays `any` ([#62](https://github.com/AntelopeJS/interface-database/pull/62)).
- **Query stages are typed by name.** `QueryStage` is a union discriminated on `stage`, built from the new exported `QueryStageMap`, and `QueryStage(name, options, ...args)` is typed by name. The protected `StagedObject#stage(type, stage)` takes a built `QueryStage`. `ValueProxy#eq` and `#ne` take `StagedObject | T` instead of `unknown`. `pluck` answers `Pick<T, K>` and `without` answers `Omit<T, K>`. Key, table, index and field names are `keyof T & string`. `Table#between` bounds are `T[TK] & IndexBound`, so a field that holds no index value stops compiling as a bound. `ValueProxy#add` takes an operand that fits its receiver, so two dates, or a string on a number, stop at compile time ([#51](https://github.com/AntelopeJS/interface-database/pull/51)).
- **Written documents are typed as write values.** `DeepPartial` drops `bigint` and `symbol` leaves, maps a field typed `unknown` to `WriteValue`, keeps a field typed `any` as `any`, and maps any other non-object type to `never`. The `insert`, `update` and `replace` builders compile only while every leaf of the document is a `WriteValue`: text, a number, a boolean, `null`, `undefined`, a `Date`, a list or a nested document ([#59](https://github.com/AntelopeJS/interface-database/pull/59)).

### 📖 Documentation

- **readme:** Use one Discord invite ([#57](https://github.com/AntelopeJS/interface-database/pull/57))
- **github:** Send questions and ideas to Discord ([#64](https://github.com/AntelopeJS/interface-database/pull/64))

### 📦 Build

- **deps:** Test against @antelopejs/mongodb 1.6.0 ([#46](https://github.com/AntelopeJS/interface-database/pull/46))
- **deps:** Bump @antelopejs/tooling-configs to 0.2.17 ([#48](https://github.com/AntelopeJS/interface-database/pull/48))

### 🏡 Chore

- Land the cleanup campaign on main ([#71](https://github.com/AntelopeJS/interface-database/pull/71))
- Land the cleanup campaign on main ([#72](https://github.com/AntelopeJS/interface-database/pull/72))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.2.0

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.11...v0.2.0)

### 🚀 Enhancements

- **database:** ⚠️  Tighten the published contract ([960eb17](https://github.com/AntelopeJS/interface-database/commit/960eb17))

### 💅 Refactors

- Clean the repo with the guardrail pack ([#43](https://github.com/AntelopeJS/interface-database/pull/43))
- Clear avoidable findings with pack 0.2.11 ([#44](https://github.com/AntelopeJS/interface-database/pull/44))

### 📖 Documentation

- **changelog:** Upgrade notes of interface-database 0.1.11 ([#38](https://github.com/AntelopeJS/interface-database/pull/38))

### 📦 Build

- Adopt the AntelopeJS guardrail pack ([#39](https://github.com/AntelopeJS/interface-database/pull/39))

### 🏡 Chore

- Configure Renovate with the shared preset ([#40](https://github.com/AntelopeJS/interface-database/pull/40))

### ✅ Tests

- **skills:** Add eval cases for database-interface ([#41](https://github.com/AntelopeJS/interface-database/pull/41))

#### ⚠️ Breaking Changes

- **database:** ⚠️  Tighten the published contract ([960eb17](https://github.com/AntelopeJS/interface-database/commit/960eb17))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.1.11

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.10...v0.1.11)

### Upgrade notes

- `IndexDefinition.unique?: boolean`: two rows of one instance may not share the key of the index (unique within each instance, `crossInstance` or not) ([#37](https://github.com/AntelopeJS/interface-database/pull/37)).
- `DuplicateKeyError(index, fields)` is thrown by the database module when a write would duplicate the key of a unique index, the primary key `_id` included (`index: "_id"`, `fields: ["_id"]`). Recognise it with `IsDuplicateKeyError(value)`, which works across interface copies (`instanceof` does not).
- Implementers must honour `unique` and throw `DuplicateKeyError`: drivers implementing this contract declare `>=0.1.11 <0.2.0` (`@antelopejs/mongodb` 1.5, `@antelopejs/postgres` 0.2.2, `@antelopejs/rethinkdb` 1.5). This contract ships as a patch release; an older driver does not throw the typed error.

### 🚀 Enhancements

- **schema:** Unique indexes and a typed DuplicateKeyError ([#37](https://github.com/AntelopeJS/interface-database/pull/37))

### 📖 Documentation

- Improve task-based onboarding and contract guidance ([#34](https://github.com/AntelopeJS/interface-database/pull/34))
- Clarify learning paths and illustrate real outcomes ([#36](https://github.com/AntelopeJS/interface-database/pull/36))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>

## v0.1.10

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.9...v0.1.10)

### 📖 Documentation

- Rewrite the README ([#31](https://github.com/AntelopeJS/interface-database/pull/31))
- **agents:** Simplify repository guidance ([#32](https://github.com/AntelopeJS/interface-database/pull/32))
- Align typed queries and change feeds with current API ([#33](https://github.com/AntelopeJS/interface-database/pull/33))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>

## v0.1.9

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.8...v0.1.9)

### 🚀 Enhancements

- **query:** Recognise query objects from another interface instance ([#29](https://github.com/AntelopeJS/interface-database/pull/29))

### ❤️ Contributors

- Thomas ([@Thomasims](http://github.com/Thomasims))

## v0.1.8

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.7...v0.1.8)

### 🚀 Enhancements

- **schema:** Add crossInstance flag to IndexDefinition ([#27](https://github.com/AntelopeJS/interface-database/pull/27))

### 📖 Documentation

- **readme:** Remove social card image ([#22](https://github.com/AntelopeJS/interface-database/pull/22))

### 🏡 Chore

- Align community files with the organization defaults ([#21](https://github.com/AntelopeJS/interface-database/pull/21))
- Remove .git-blame-ignore-revs ([#23](https://github.com/AntelopeJS/interface-database/pull/23))

### 🤖 CI

- Use shared npm release workflow ([#20](https://github.com/AntelopeJS/interface-database/pull/20))
- **release:** Release next from a dedicated branch and restore requireCommits ([#24](https://github.com/AntelopeJS/interface-database/pull/24))
- **release:** Reference the shared release workflows through v1 ([#25](https://github.com/AntelopeJS/interface-database/pull/25))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>

## v0.1.7

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.6...v0.1.7)

### 🚀 Enhancements

- **query:** Add standalone staged-query entry ([#19](https://github.com/AntelopeJS/interface-database/pull/19))

### ✅ Tests

- Use published mongodb 1.3.0 for interface conformance ([#18](https://github.com/AntelopeJS/interface-database/pull/18))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>

## v0.1.6

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.5...v0.1.6)

### ✅ Tests

- **database:** Add backend atomic mutation conformance ([#17](https://github.com/AntelopeJS/interface-database/pull/17))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>

## v0.1.5

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.4...v0.1.5)

### 🚀 Enhancements

- **database:** Add explicit atomic single-record mutations ([#15](https://github.com/AntelopeJS/interface-database/pull/15))

### 🏡 Chore

- Replace Biome with oxlint, oxfmt and Knip ([#14](https://github.com/AntelopeJS/interface-database/pull/14))

### 🤖 CI

- Standardize npm releases ([#13](https://github.com/AntelopeJS/interface-database/pull/13))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>
- Thomas ([@Thomasims](http://github.com/Thomasims))

## v0.1.4

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.3...v0.1.4)

### 🚀 Enhancements

- **skills:** Ship a consumer skill with the package ([#11](https://github.com/AntelopeJS/interface-database/pull/11))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>

## v0.1.3

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.2...v0.1.3)

## v0.1.2

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.1...v0.1.2)

### 🚀 Enhancements

- **selection:** Accept ValueProxy keys in Table.get and Table.getAll ([#9](https://github.com/AntelopeJS/interface-database/pull/9))

### 📖 Documentation

- Fix Stream.group() mapper parameter naming ([b4424bd](https://github.com/AntelopeJS/interface-database/commit/b4424bd))

### ✅ Tests

- Bump mongodb module to 1.2.1 and set test database name ([ac8a80b](https://github.com/AntelopeJS/interface-database/commit/ac8a80b))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
- Thomasims <thomas@antelopejs.com>

## v0.1.1

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.1.0...v0.1.1)

### 🚀 Enhancements

- Explicit instance lifecycle; CROSS_TENANT → CROSS_INSTANCE ([#7](https://github.com/AntelopeJS/interface-database/pull/7))
- Accept io-ts codecs as table field types ([#8](https://github.com/AntelopeJS/interface-database/pull/8))

### ❤️ Contributors

- Thomas ([@Thomasims](http://github.com/Thomasims))

## v0.1.0

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.0.4...v0.1.0)

### 🚀 Enhancements

- Per-table tenantScoped + CROSS_TENANT + physicalStore ([#6](https://github.com/AntelopeJS/interface-database/pull/6))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>

## v0.0.4

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.0.3...v0.0.4)

### 🏡 Chore

- Package maintenance ([#5](https://github.com/AntelopeJS/interface-database/pull/5))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>

## v0.0.3

[compare changes](https://github.com/AntelopeJS/interface-database/compare/v0.0.2...v0.0.3)

### 💅 Refactors

- Switch test modules from local to npm packages ([dde5ce9](https://github.com/AntelopeJS/interface-database/commit/dde5ce9))

### 📖 Documentation

- Rewrite documentation for production readiness ([c4cb118](https://github.com/AntelopeJS/interface-database/commit/c4cb118))

### 🏡 Chore

- Update dependencies ([e6b77a7](https://github.com/AntelopeJS/interface-database/commit/e6b77a7))
- Upgrade test MongoDB binary to 8.0.8 ([8a442cf](https://github.com/AntelopeJS/interface-database/commit/8a442cf))

### ✅ Tests

- Add comprehensive test coverage ([#4](https://github.com/AntelopeJS/interface-database/pull/4))

### 🎨 Styles

- Format test config ([979b144](https://github.com/AntelopeJS/interface-database/commit/979b144))

### 🤖 CI

- Add test step to CI workflow ([58db837](https://github.com/AntelopeJS/interface-database/commit/58db837))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
- Thomas ([@Thomasims](http://github.com/Thomasims))

## v0.0.2

### 🚀 Enhancements

- Initial interface-database package ([f73d27c](https://github.com/AntelopeJS/interface-database/commit/f73d27c))

### 📖 Documentation

- Clarify current version status ([b6ca2ce](https://github.com/AntelopeJS/interface-database/commit/b6ca2ce))
- Update license section in README.md ([e24f75b](https://github.com/AntelopeJS/interface-database/commit/e24f75b))
- Updates badge URL ([a9ca1a0](https://github.com/AntelopeJS/interface-database/commit/a9ca1a0))
- Improved shields ([#1](https://github.com/AntelopeJS/interface-database/pull/1))
- Fixed link to README.md dans docs/index.md ([#2](https://github.com/AntelopeJS/interface-database/pull/2))
- Added lookup feature documentation ([#3](https://github.com/AntelopeJS/interface-database/pull/3))

### 🏡 Chore

- Import existing codebase ([e636f47](https://github.com/AntelopeJS/interface-database/commit/e636f47))
- Rename version ([05f7fd2](https://github.com/AntelopeJS/interface-database/commit/05f7fd2))
- Rename license file ([fce108c](https://github.com/AntelopeJS/interface-database/commit/fce108c))
- Update @antelopejs/interface-core to 0.0.2 ([e73fc81](https://github.com/AntelopeJS/interface-database/commit/e73fc81))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
- Glastis ([@Glastis](http://github.com/Glastis))
