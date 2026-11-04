const SHOP = `
const shop = new db.Schema("shop", {
  products: { fields: { name: "string", price: "number", tags: "string[]" }, indexes: { price: {}, tags: { multi: true }, sku: { unique: true, crossInstance: true } } },
  orders: { fields: { total: "number" }, indexes: { total: {} } },
});
const products = shop.instance().table("products");
`;

/** Scenario bodies for the schema and table features, by journey id. */
export const SCHEMA_BODIES = {
  "schema-registry": `
    const definition = { notes: { fields: { title: "string" }, indexes: {} } };
    const first = new db.Schema("notes-demo", definition);
    const registered = seen.schemas.map(([name, def]) => [name, def]);
    const found = [db.Schema.get("notes-demo") === first, db.Schema.get("missing-schema") === undefined];
    const listed = [...db.Schema.list().keys()];
    const again = new db.Schema("notes-demo", { notes: { fields: {}, indexes: {} } });
    const replaced = [db.Schema.get("notes-demo") === again, db.Schema.list().get("notes-demo") === again, seen.schemas.length];
    const other = new db.Schema("other-demo", definition);
    return { registered, found, listed, replaced, listedAfter: [...db.Schema.list().keys()], identity: [first.id, first.definition === definition, other.id] };
  `,
  "schema-stages": `
    const s = new db.Schema("tenants", { people: { fields: {}, indexes: {} } });
    return {
      defaultInstance: show(s.instance().table("people")),
      named: show(s.instance("acme").table("people")),
      cross: show(s.instance(db.CROSS_INSTANCE).table("people")),
      crossSymbol: [db.CROSS_INSTANCE === Symbol.for("@antelopejs/interface-database/CROSS_INSTANCE"), typeof db.CROSS_INSTANCE],
      create: show(s.createInstance("acme")),
      createDefault: show(s.createInstance()),
      destroy: show(s.destroyInstance("acme")),
      list: show(s.listInstances()),
    };
  `,
  "schema-run": `
    const s = new db.Schema("tutorial", { notes: { fields: {}, indexes: {} } });
    answer = "acme";
    const created = await s.createInstance("acme");
    answer = [];
    const listed = await s.listInstances();
    answer = undefined;
    await s.destroyInstance("acme");
    return { created, listed, runs: seen.runs.map(show), lazy: await (async () => { const before = seen.runs.length; s.createInstance("later"); await sleepTick(); return seen.runs.length - before; })() };
  `,
} satisfies { [id: string]: string };

/** Table reads and writes: what get, getAll, between, insert, update, replace and delete send to the provider. */
export const TABLE_BODIES = {
  "table-reads": `${SHOP}
    const when = new Date("2024-01-01T00:00:00.000Z");
    return {
      whole: show(products),
      get: show(products.get("product-1")),
      getAllKey: show(products.getAll("p-1")),
      getAllKeys: show(products.getAll(["p-1", "p-2"])),
      getAllIndex: show(products.getAll("shoes", "tags")),
      getAllNumber: show(products.getAll(10, "price")),
      getAllCompound: show(products.getAll([["a", 1], ["b", 2]], "pair")),
      between: show(products.between("price", 10, 20)),
      betweenDates: show(products.between("price", when, new Date("2024-02-01T00:00:00.000Z"))),
      betweenCompound: show(products.between("price", [1, "a"], [2, "b"])),
      betweenNull: show(products.between("price", null, 5)),
      selectionFromGetAll: show(products.getAll("x", "tags").count()),
    };
  `,
  "table-writes": `${SHOP}
    return {
      insertOne: show(products.insert({ name: "Boot", price: 80 })),
      insertMany: show(products.insert([{ name: "A" }, { name: "B" }])),
      insertUpdate: show(products.insert({ _id: "p-1", name: "New" }, { conflict: "update" })),
      insertReplace: show(products.insert({ _id: "p-1" }, { conflict: "replace" })),
      update: show(products.getAll("shoes", "tags").update({ price: 5 })),
      updateComputed: show(products.get("p-1").update((p) => ({ price: p.key("price").add(1) }))),
      replace: show(products.get("p-1").replace({ _id: "p-1", name: "R" })),
      remove: show(products.get("p-1").delete()),
      removeMany: show(products.filter((p) => p.key("price").lt(5)).delete()),
      changesOne: show(products.get("p-1").changes()),
      changesAll: show(products.changes()),
    };
  `,
  "table-results": `${SHOP}
    answer = ["id-1", "id-2"];
    const ids = await products.insert([{ name: "A" }, { name: "B" }], { conflict: "update" });
    answer = 3;
    const updated = await products.getAll("shoes", "tags").update({ price: 1 });
    answer = null;
    const missing = await products.get("nope");
    answer = new Error("provider refused");
    const refused = await fails(() => products.get("p-1").delete());
    return { ids, updated, missing, refused, runs: seen.runs.map(show) };
  `,
} satisfies { [id: string]: string };
