---
covers:
  - src/schema.ts
  - src/staged-query/schema.ts
docs:
  - docs/2.operations/2.database_management.md
  - docs/3.results/5.database_changes.md
journeys:
  - schema-registry
  - schema-stages
  - schema-run
---

# Schemas

A module defines a `Schema`, which registers with the bound provider, then picks an instance, a table, or creates and destroys named instances.

## Sub-features

- `schema-registry`: a Schema registers with the provider, and Schema.get and Schema.list find it.
- `schema-stages`: instance, createInstance, destroyInstance and listInstances record the stages docs/3.results/5.database_changes.md names.
- `schema-run`: awaiting a schema call runs it once, and building one runs nothing.

## How to get to it (user POV)

- `const schema = new Schema("myapp", { users: { fields: {}, indexes: {} } }); await schema.createInstance("tenant-1");`

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" schemas
```

## Gotchas

- `CROSS_INSTANCE` is a global symbol (`Symbol.for`), so copies of the interface agree on it.
