---
covers:
  - src/staged-query/stages.ts
  - src/staged-query/valueproxy-conditions.ts
  - src/staged-query/common.ts
docs:
  - docs/index.md
  - docs/1.query_types/1.index.md
journeys:
  - usage-types
---

# Types

A TypeScript module sees the documented result type of each call, the table names of its schema, and the values `getAll`, `between`, `insert` and `atomicMutation` accept and refuse.

## Sub-features

- `usage-types`: the documented calls resolve to the documented result types.

## How to get to it (user POV)

- `const ids: string[] = await users.insert({ name: "A" })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" types
```

## Gotchas

- Types only; the probe compiles with `--strict` against the packed declarations.
