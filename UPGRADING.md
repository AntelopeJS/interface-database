# Upgrade notes

Each section is the upgrade-notes block of one release. Paste it into the GitHub release body and under the release's heading in `CHANGELOG.md`. The changelog generator writes only commit subjects, and some of these changes have no `!` in theirs.

## v0.3.0

- **`update()` with an `any`-typed argument resolves to `never`.** Reading its result, for example `.run()`, fails to compile (TS2339). A function argument still matches only the updater overload and an object argument only the document overload, so typed calls are unchanged. Unchecked `any` writes become compile errors. `ReturnType<typeof table.update>` is now `Query<number>`, so `await ...run()` is a `number` instead of `any` ([#65](https://github.com/AntelopeJS/interface-database/pull/65)).
- **The entries of a `FieldType` codec are typed `unknown`.** `IoTsCodec` is now a type alias with the same members, so `Object.entries` on a codec gives `[string, unknown]` instead of `[string, any]`. A consumer that passed those entries on as `FieldType` stops compiling. Narrow each entry first. Every value assignable to `FieldType` before still is ([#63](https://github.com/AntelopeJS/interface-database/pull/63)).
- **Stage operands.** A generic `T` operand, or a class instance with methods such as `ObjectId`, no longer compiles as a stage operand. `any` stays `any`.
