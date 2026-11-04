---
covers:
  - src/staged-query/stream.ts
docs:
  - docs/1.query_types/5.stream.md
  - docs/2.operations/6.filtering.md
journeys:
  - stream-shape
  - stream-order
  - stream-aggregates
  - stream-run
---

# Streams

A stream is mapped, filtered, plucked, ordered, sliced and aggregated. This feature holds the Format door of the stage list: `stream-shape` is its containment journey.

## Sub-features

- `stream-shape`: key, default, map, filter, pluck, without and union record their stages in order.
- `stream-order`: orderBy, slice and nth record index, direction and bounds, and never change the stream they extend.
- `stream-aggregates`: count, sum, avg, min, max, distinct and changes record the field they work on.
- `stream-run`: awaiting a stream hands the provider the stages and returns its answer.

## How to get to it (user POV)

- `await users.filter((u) => u.key("age").ge(18)).orderBy("name").slice(0, 10)`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" streams
```

## Gotchas

- Every operation returns a new object; the stream it extends keeps its own stages.
