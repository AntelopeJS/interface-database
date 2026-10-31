---
covers:
  - src/staged-query/valueproxy.ts
docs:
  - docs/1.query_types/9.valueproxy.md
journeys:
  - expression-arrays
---

# Expressions arrays

Inside a query callback a list is indexed, searched, sliced, mapped, filtered, counted and reduced.

## Sub-features

- `expression-arrays`: index, includes, slice, map, filter, isempty, count, sum, avg, min and max record the array stages.

## How to get to it (user POV)

- `users.filter((u) => u.key("tags").includes("vip"))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" expressions-arrays
```

## Gotchas

- The mapper and predicate of `map` and `filter` become a nested function stage.
