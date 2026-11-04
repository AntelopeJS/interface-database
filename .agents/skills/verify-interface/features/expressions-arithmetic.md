---
covers:
  - src/staged-query/valueproxy.ts
docs:
  - docs/1.query_types/9.valueproxy.md
journeys:
  - expression-arithmetic
  - expression-bits
---

# Expressions arithmetic

Inside a query callback a number is added to, subtracted from, multiplied, divided, rounded and combined bitwise.

## Sub-features

- `expression-arithmetic`: add, sub, mul, div, mod, round, ceil and floor record the operand a proxy, a number, a string or a list.
- `expression-bits`: band, bor, bxor, bnot and the shifts record the bit stages.

## How to get to it (user POV)

- `users.update((u) => ({ loginCount: u.key("loginCount").add(1) }))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" expressions-arithmetic
```

## Gotchas

- `add` also takes a string or a list, and `sub` a date.
