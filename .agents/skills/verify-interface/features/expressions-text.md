---
covers:
  - src/staged-query/valueproxy.ts
docs:
  - docs/1.query_types/9.valueproxy.md
journeys:
  - expression-text
---

# Expressions text

Inside a query callback a string is split, concatenated, case-folded, measured and matched against a regular expression.

## Sub-features

- `expression-text`: split, concat, upcase, downcase, strlen and match record the string stages.

## How to get to it (user POV)

- `users.filter((u) => u.key("email").match("^a"))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" expressions-text
```

## Gotchas

- `split` with no separator records an undefined separator.
