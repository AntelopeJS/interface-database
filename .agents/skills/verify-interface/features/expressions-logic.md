---
covers:
  - src/staged-query/valueproxy.ts
docs:
  - docs/1.query_types/9.valueproxy.md
  - docs/2.operations/6.filtering.md
journeys:
  - expression-logic
  - expression-objects
---

# Expressions logic

Inside a query callback a `ValueProxy` compares, combines and reads fields: `eq`, `ne`, `and`, `or`, `not`, `gt` to `le`, `default`, `key`, `merge`, `keys`, `values`, `hasfields`.

## Sub-features

- `expression-logic`: eq, ne, and, or, not, comparisons and default record their operand.
- `expression-objects`: key, merge, keys, values and hasfields record the field access of a ValueProxy.

## How to get to it (user POV)

- `users.filter((u) => u.key("status").eq("active").and(u.key("age").ge(18)))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" expressions-logic
```

## Gotchas

- A `ValueProxy` is not a fetched value; only its recorded stages travel to the provider.
