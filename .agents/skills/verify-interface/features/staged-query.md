---
covers:
  - src/staged-query/index.ts
  - src/staged-query/common.ts
docs:
  - docs/index.md
journeys:
  - staged-isolation
---

# Staged query

A build tool imports `@antelopejs/interface-database/staged-query`, builds queries and reads `build()`; the entry point never loads `interface-core` or `node:async_hooks`, its queries cannot run, and the root entry later gives the same classes `run`, `then` and `cursor`.

## Sub-features

- `staged-isolation`: the build-only entry point loads without interface-core and builds queries that cannot run.

## How to get to it (user POV)

- `import { Schema } from "@antelopejs/interface-database/staged-query"` in a codegen tool.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" staged-query
```

## Gotchas

- The repository's `pnpm test:staged-query` checks the same isolation but runs outside `pnpm run checks`.
