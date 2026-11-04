---
covers:
  - package.json
  - src/index.ts
  - src/common.ts
  - src/datum.ts
  - src/selection.ts
  - src/stream.ts
  - src/valueproxy.ts
docs:
  - docs/index.md
  - README.md
journeys:
  - subpaths
---

# Entry points

A module imports from the root entry or from one of the subpaths the exports map lists; `typesVersions` lists the same subpaths for older resolvers.

## Sub-features

- `subpaths`: every export subpath resolves through the exports map and names what docs/index.md says.

## How to get to it (user POV)

- `import { Changes } from "@antelopejs/interface-database/common"`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" entry-points
```

## Gotchas

- A new subpath needs an entry in both `exports` and `typesVersions`.
