---
covers:
  - src/staged-query/atomic.ts
docs:
  - docs/2.operations/8.atomic_mutations.md
journeys:
  - atomic-requests
---

# Atomic requests

A module asks for one conditional change of one record: update or delete under a revision, or delete when one field still equals what was observed. Anything outside that contract is refused before it runs.

## Sub-features

- `atomic-requests`: atomicMutation refuses every request docs/2.operations/8.atomic_mutations.md excludes, before anything is run.

## How to get to it (user POV)

- `await table.atomicMutation(id, { type: "delete", revisionField: "revision", expectedRevision: observed })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" atomic-requests
```

## Gotchas

- The refusals are `TypeError`s thrown synchronously by `atomicMutation`, so no provider is reached.
