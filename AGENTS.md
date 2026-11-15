# interface-database

AQL, the AntelopeJS database query builder, published as `@antelopejs/interface-database`. It declares the contract; database modules such as `@antelopejs/mongodb`, `@antelopejs/mysql`, `@antelopejs/postgres` and `@antelopejs/rethinkdb` implement it.

## Layout

- `src/` holds the runtime entry points. `index.ts` is the root export and re-exports `errors.ts`; every other top-level module, and `staged-query/`, is a subpath listed in both `exports` and `typesVersions` in `package.json`. A new subpath needs an entry in both. `antelope.test.ts` is the test project, not a subpath.
- `src/staged-query/` is the build-only entry point. It must not import `@antelopejs/interface-core` or `node:async_hooks`; `scripts/test-staged-query.cjs` enforces that against `dist`.
- `src/tests/` is the conformance suite. It compiles to `dist/tests` and ships in the package, and the database modules run it against their driver, so a change there changes what every implementer must pass. `datasets/` and `helpers/` are its fixtures.
- `skills/` and `docs/` ship in the package. `docs/` is the source of interfaces.antelopejs.com/docs/database, and its code samples typecheck through `docs/tsconfig.json`, which maps the package onto `src`.

## Versioning

- Database modules cap their range below the next minor of this package, for example `>=0.1.11 <0.2.0`. When a change adds something they must implement, list it under `### Upgrade notes` in `CHANGELOG.md`, with the module versions that honour it.
- The release commit writes `CHANGELOG.md`. Upgrade notes follow in a separate `docs(changelog)` pull request.

## Tests

- `pnpm test` builds, then runs `ajs module test .` with `src/antelope.test.ts`: it starts an in-memory MongoDB 8.0.8 replica set and runs `dist/tests` through `@antelopejs/mongodb` 1.8, a devDependency loaded as a local module. `pnpm-workspace.yaml` overrides the `@antelopejs/interface-database` dependency of `@antelopejs/mongodb` with a link to this package, and the suites import the code under test by relative path, so they exercise the local build: without the override they would run the published copy the implementer installs. Do not import `@antelopejs/interface-database` by name in a suite. The first run downloads the MongoDB binary.
- `pnpm run checks` does not run the docs check (links and type-checked samples in `README.md` and `docs/`); only CI runs it, through the `docs-files` input of `ci.yml`.
- `pnpm run checks` and CI do not run `pnpm test:staged-query`, the isolation and parity test of the build-only entry point. Run it when you change `src/staged-query/`.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

CI runs `pnpm run checks` in full on every pull request and reports what failed. The commit hook formats and lints the staged files. Locally, run only the fast check for what you touched:

- `pnpm run typecheck` after you change types or signatures.
- `pnpm exec oxlint <files>` and `pnpm exec oxfmt <files>` on the files you changed.
- One test file, not the suite. In a module that tests with `ajs module test`: `pnpm run build`, then `pnpm exec ajs module test . -f dist/<path>.test.js`.

Prove a change works with the verification skill in [`.agents/skills/verify-interface/SKILL.md`](.agents/skills/verify-interface/SKILL.md) before you call it done.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

### Suppressions

`guardrails.suppressions.json` caps lint directives, `@ts-expect-error`, `SAFETY:` comments and rules a lint config turns off. Over a cap, fix the code or remove another suppression of that kind; only the operator raises a number. After removing suppressions, run `pnpm run suppressions:update` and commit the file.

<!-- antelopejs-guardrails:end -->
