---
covers:
  - src/staged-query/kind.ts
  - src/staged-query/query.ts
  - src/staged-query/valueproxy-kind.ts
docs:
  - docs/1.query_types/1.index.md
journeys:
  - query-kinds
---

# Kinds

`IsQuery`, `IsStream`, `IsDatum` and `IsValueProxy` tell what a value is, including a value built by another copy of the interface, which `instanceof` cannot.

## Sub-features

- `query-kinds`: IsQuery, IsStream, IsDatum and IsValueProxy tell the staged kinds apart, copies of the interface included.

## How to get to it (user POV)

- `IsStream(query) ? "a sequence" : "a single value"`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" kinds
```

## Gotchas

- A copy is simulated with the global marker symbol each class sets on its prototype.
