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

- The smoke feature covers no glob. The shared `every-function` journey cannot read this package's declarations (a call-stack overflow in the declaration walker), so `through-core` stands in for it.
