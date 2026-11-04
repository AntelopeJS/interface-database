---
covers:
  - src/atomic.ts
docs:
  - docs/2.operations/8.atomic_mutations.md
journeys:
  - atomic-execution
---

# Atomic execution

Awaiting an atomic mutation resolves to `applied`, `not-applied` or `unknown`; any other provider answer is an `AtomicMutationUnsupportedError`; cursors are refused; nothing is retried.

## Sub-features

- `atomic-execution`: an atomic mutation resolves to applied, not-applied or unknown, refuses any other answer, and is never retried.

## How to get to it (user POV)

- `const outcome = await table.atomicMutation(id, request)`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" atomic-execution
```

## Gotchas

- A rejected run is called once: the interface never retries an uncertain mutation.
