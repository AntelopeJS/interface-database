---
covers:
  - src/errors.ts
docs:
  - docs/2.operations/4.crud.md
journeys:
  - duplicate-key-error
---

# Duplicate key

A write that repeats a unique key rejects with a `DuplicateKeyError` naming the index and its fields; `IsDuplicateKeyError` also recognises the error of another copy of the interface.

## Sub-features

- `duplicate-key-error`: DuplicateKeyError carries the index and fields, and IsDuplicateKeyError recognises another copy's error.

## How to get to it (user POV)

- `if (IsDuplicateKeyError(error)) show(error.index)`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" duplicate-key
```

## Gotchas

- The journey builds the error the way a database module does; a provider's own throw is covered by its conformance suite.
