# interface-database

AQL, the AntelopeJS database query builder, published as `@antelopejs/interface-database`. It declares the contract; database modules such as `@antelopejs/mongodb`, `@antelopejs/postgres` and `@antelopejs/rethinkdb` implement it.

## Layout

- `src/` holds the runtime entry points. `index.ts` is the root export and re-exports `errors.ts`; every other top-level module, and `staged-query/`, is a subpath listed in both `exports` and `typesVersions` in `package.json`. A new subpath needs an entry in both. `antelope.test.ts` is the test project, not a subpath.
- `src/staged-query/` is the build-only entry point. It must not import `@antelopejs/interface-core` or `node:async_hooks`; `scripts/test-staged-query.cjs` enforces that against `dist`.
- `src/tests/` is the conformance suite. It compiles to `dist/tests` and ships in the package, and the database modules run it against their driver, so a change there changes what every implementer must pass. `datasets/` and `helpers/` are its fixtures.
- `skills/` and `docs/` ship in the package. `docs/` is the source of interfaces.antelopejs.com/docs/database, and its code samples typecheck through `docs/tsconfig.json`, which maps the package onto `src`.

## Versioning

- Database modules cap their range below the next minor of this package, for example `>=0.1.11 <0.2.0`. When a change adds something they must implement, list it under `### Upgrade notes` in `CHANGELOG.md`, with the module versions that honour it.
- The release commit writes `CHANGELOG.md`. Upgrade notes follow in a separate `docs(changelog)` pull request.

## Tests

- `pnpm test` builds, then runs `ajs module test .` with `src/antelope.test.ts`: it starts an in-memory MongoDB 8.0.8 replica set and runs `dist/tests` through `@antelopejs/mongodb` 1.3.1. The first run downloads the MongoDB binary.
- `pnpm run checks` does not run the docs check (links and type-checked samples in `README.md` and `docs/`); only CI runs it, through the `docs-files` input of `ci.yml`.
- `pnpm run checks` and CI do not run `pnpm test:staged-query`, the isolation and parity test of the build-only entry point. Run it when you change `src/staged-query/`.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Finish every change with `pnpm run checks`. It runs typecheck, lint, format, knip, tests, size, ratchet, and sync, and prints only what failed. The change is done when it prints no failure.

The tools enforce most rules, listed in the table at the end. The sections below hold the rules no tool checks.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### Debt

`guardrails.ratchet.json` records the lint findings and oversize files this repository already had. Its numbers only go down. After you remove debt, run `pnpm run ratchet:update` and commit the lowered file. A rule listed there is off for `oxlint`. The ratchet counts it instead, and the pre-commit hook rejects it on every line you add.

### What enforces what

| Rule                                                                           | Enforced by                               |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| Formatting                                                                     | oxfmt                                     |
| Lint findings are errors; no rule warns                                        | oxlint preset                             |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                  |
| Every test asserts                                                             | `antelopejs/require-assertion`            |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`          |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`  |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test` |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`       |
| Files ≤ 20,000 bytes, tests included                                           | `antelopejs-check-size` (pre-commit)      |
| Existing debt only shrinks                                                     | `antelopejs-ratchet`                      |
| Types check                                                                    | `tsc` (pre-push)                          |
| No dead files, exports, or dependencies                                        | knip                                      |
| Managed files match the pack                                                   | `antelopejs-sync --check`                 |
| A test names the wrong implementation it catches                               | review; no tool                           |

<!-- antelopejs-guardrails:end -->
