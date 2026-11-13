# Upgrade notes

Each section is the upgrade-notes block of one release. Paste it into the GitHub release body and under the release's heading in `CHANGELOG.md`. The changelog generator writes only commit subjects, and some of these changes have no `!` in theirs.

## v0.4.0

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

## v0.3.0

- **`update()` with an `any`-typed argument resolves to `never`.** Reading its result, for example `.run()`, fails to compile (TS2339). A function argument still matches only the updater overload and an object argument only the document overload, so typed calls are unchanged. Unchecked `any` writes become compile errors. `ReturnType<typeof table.update>` is now `Query<number>`, so `await ...run()` is a `number` instead of `any` ([#65](https://github.com/AntelopeJS/interface-database/pull/65)).
- **The entries of a `FieldType` codec are typed `unknown`.** `IoTsCodec` is now a type alias with the same members, so `Object.entries` on a codec gives `[string, unknown]` instead of `[string, any]`. A consumer that passed those entries on as `FieldType` stops compiling. Narrow each entry first. Every value assignable to `FieldType` before still is ([#63](https://github.com/AntelopeJS/interface-database/pull/63)).
- **Stage operands are checked as query values.** A generic `T` operand, or a class instance with methods such as `ObjectId`, no longer compiles as a stage operand. Neither does an operand that holds a `bigint`, a `symbol`, a function or a value typed `unknown`. `eq`, `ne`, `gt`, `ge`, `lt`, `le` and `includes` check their operand against the receiver's type. `constant`, `default`, `sub`, `merge` and the default of `key` refuse an `interface`-typed record: declare it with `type`. A generic `K extends keyof T` no longer compiles as a `ValueProxy.key`. `any` stays `any` ([#62](https://github.com/AntelopeJS/interface-database/pull/62)).
- **Query stages are typed by name.** `QueryStage` is a union discriminated on `stage`, built from the new exported `QueryStageMap`, and `QueryStage(name, options, ...args)` is typed by name. The protected `StagedObject#stage(type, stage)` takes a built `QueryStage`. `ValueProxy#eq` and `#ne` take `StagedObject | T` instead of `unknown`. `pluck` answers `Pick<T, K>` and `without` answers `Omit<T, K>`. Key, table, index and field names are `keyof T & string`. `Table#between` bounds are `T[TK] & IndexBound`, so a field that holds no index value stops compiling as a bound. `ValueProxy#add` takes an operand that fits its receiver, so two dates, or a string on a number, stop at compile time ([#51](https://github.com/AntelopeJS/interface-database/pull/51)).
- **Written documents are typed as write values.** `DeepPartial` drops `bigint` and `symbol` leaves, maps a field typed `unknown` to `WriteValue`, keeps a field typed `any` as `any`, and maps any other non-object type to `never`. The `insert`, `update` and `replace` builders compile only while every leaf of the document is a `WriteValue`: text, a number, a boolean, `null`, `undefined`, a `Date`, a list or a nested document ([#59](https://github.com/AntelopeJS/interface-database/pull/59)).
