---
covers:
  - src/staged-query/selection.ts
  - src/staged-query/common.ts
  - src/staged-query/stages.ts
docs:
  - docs/1.query_types/2.table.md
  - docs/2.operations/3.table_operations.md
journeys:
  - table-reads
---

# Tables read

A table is read whole, by primary key (`get`), by secondary index (`getAll`) or by range (`between`, low bound included, high bound excluded).

## Sub-features

- `table-reads`: get, getAll and between record the key, index and bounds docs/1.query_types/2.table.md describes.

## How to get to it (user POV)

- `await users.getAll("admin", "role").run()` and `await users.between("createdAt", from, to).run()`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" tables-read
```

## Gotchas

- The journey reads the stages the provider receives; it proves what a driver is asked, not what a database answers.
