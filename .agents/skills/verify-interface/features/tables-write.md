---
covers:
  - src/staged-query/selection.ts
docs:
  - docs/2.operations/4.crud.md
  - docs/1.query_types/3.selection.md
  - docs/1.query_types/4.single_selection.md
journeys:
  - table-writes
  - table-results
---

# Tables write

A module inserts (with `conflict: "update"` or `"replace"`), updates with a partial document or a computed function, replaces, deletes and subscribes to changes.

## Sub-features

- `table-writes`: insert, update, replace, delete and changes record the stages docs/2.operations/4.crud.md describes.
- `table-results`: a write resolves to what the provider answered, and a provider failure rejects the caller.

## How to get to it (user POV)

- `await users.insert({ _id: "u" }, { conflict: "update" })` and `await users.get("u").delete()`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" tables-write
```

## Gotchas

- A provider failure rejects the caller with the provider's own error.
