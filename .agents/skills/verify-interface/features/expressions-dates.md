---
covers:
  - src/staged-query/valueproxy.ts
docs:
  - docs/1.query_types/9.valueproxy.md
journeys:
  - expression-dates
---

# Expressions dates

Inside a query callback a date is tested against a range, broken into calendar parts in an optional timezone, or turned into epoch seconds.

## Sub-features

- `expression-dates`: during, the calendar parts and epoch record the date stages, with a timezone stage when one is given.

## How to get to it (user POV)

- `orders.filter((o) => o.key("createdAt").year("Europe/Paris").eq(2024))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" expressions-dates
```

## Gotchas

- A timezone adds a `date_with_timezone` stage before the part.
