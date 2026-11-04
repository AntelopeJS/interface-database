---
covers:
  - src/query.ts
docs:
  - docs/1.query_types/7.query.md
  - docs/1.query_types/1.index.md
journeys:
  - query-execution
  - query-cursor
---

# Execution

A query is lazy; `await`, `run()` and `then()` run it once, `cursor()` and `for await` read it one result at a time and close the cursor when the consumer stops.

## Sub-features

- `query-execution`: await, run and then run a query once each, lazily, and pass the provider's failure on.
- `query-cursor`: cursor and for await read the provider one result at a time and close the cursor when the consumer stops.

## How to get to it (user POV)

- `for await (const user of users) { if (done(user)) break; }`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" execution
```

## Gotchas

- Cursor ids count up per process; the journey reads them from a fresh process.
