---
covers:
  - src/staged-query/stream.ts
docs:
  - docs/1.query_types/5.stream.md
  - docs/2.operations/7.lookup.md
journeys:
  - join-stages
  - group-stages
---

# Joins

A stream is joined to another (left or inner), looked up through a foreign key, or grouped by an index.

## Sub-features

- `join-stages`: join, joinInner and lookup record the right side, the predicate and the mapper.
- `group-stages`: group records its index and a mapper over the sub-stream and the group key.

## How to get to it (user POV)

- `await users.joinInner(orders, (u, o) => o.key("userId").eq(u.key("_id")), (u, o) => ({ amount: o.key("amount") }))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" joins
```

## Gotchas

- The right side of a join is embedded as a nested stage list, argument ids included.
