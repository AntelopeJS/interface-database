---
covers:
  - src/staged-query/datum.ts
docs:
  - docs/1.query_types/8.datum.md
journeys:
  - datum-stages
  - datum-run
---

# Datums

A single document or value is read, a field is picked, defaulted, transformed with `do`, looked up or plucked.

## Sub-features

- `datum-stages`: key, default, do, lookup, pluck and cast on one document record docs/1.query_types/8.datum.md.
- `datum-run`: awaiting a document or one of its fields returns the provider's answer, null included.

## How to get to it (user POV)

- `await users.get("u").key("address").key("city")`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" datums
```

## Gotchas

- A missing document resolves to whatever the provider answers, `null` included, although the declared type is `T`.
