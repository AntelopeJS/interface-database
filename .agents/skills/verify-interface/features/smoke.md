---
covers:
docs:
  - README.md
  - docs/index.md
journeys:
  - through-core
---

# Smoke

The fixed journey every verdict runs: pack the interface, load it in `ajs project dev` with a stub provider and a consumer, and call the proxies a database module implements (`RunQuery`, `ReadCursor`, `CloseCursor`) and the schema registry.

## Sub-features

- `through-core`: the query proxies and the schema registry answer through core from a stub provider.

## How to get to it (user POV)

- A project with a database module and a module that imports `@antelopejs/interface-database`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob. `through-core` stands in for the shared journeys, which run here since tooling-configs 0.5.1 but cannot pass on this package:
  - `every-function` lists every prototype method of an exported class from the `.d.ts` files, while the consumer walks only top-level exports, so each method reads as declared but not exported.
  - `minor-bump` compares signatures that embed TypeScript's internal symbol ids (`__@asyncIterator@<n>`), which differ between two builds of the same source, so every class reads as changed.
