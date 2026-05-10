import { CROSS_TENANT, Schema } from "@antelopejs/interface-database";
import { expect } from "chai";
import { Vehicle } from "./datasets/vehicles";

const tableName = "vehicles";

function vehicle(car: string, price: number): Vehicle {
  return {
    car,
    manufactured: new Date("2020-01-01"),
    price,
    isElectric: false,
    kilometers: 1000,
  };
}

const globalSchema = new Schema<{ [tableName]: Vehicle }>("test-im-global", {
  [tableName]: Vehicle,
});
const tenantSchema = new Schema<{ [tableName]: Vehicle }>("test-im-tenant", {
  [tableName]: { ...Vehicle, tenantScoped: true },
});

describe("Global Tables", () => {
  it("CRUD without tenant context", GlobalCrud);
  it("Tenant id is ignored on global tables", GlobalIgnoresTenant);

  after(async () => {
    await globalSchema.instance().table(tableName).delete().run();
  });
});

async function GlobalCrud() {
  const table = globalSchema.instance().table(tableName);

  const keys = await table.insert([vehicle("Renault", 5000)]).run();
  expect(keys).to.have.lengthOf(1);

  const doc = await table.get(keys[0]).run();
  expect(doc).to.have.property("car", "Renault");

  const updated = await table.get(keys[0]).update({ price: 7777 }).run();
  expect(updated).to.equal(1);

  const deleted = await table.get(keys[0]).delete().run();
  expect(deleted).to.equal(1);

  const gone = await table.get(keys[0]).run();
  expect(gone).to.equal(undefined);
}

async function GlobalIgnoresTenant() {
  const tableNoTenant = globalSchema.instance().table(tableName);
  const tableWithTenant = globalSchema.instance("anything").table(tableName);

  await tableNoTenant.insert([vehicle("Citroen", 4000)]).run();
  const seen = await tableWithTenant.run();
  expect(seen).to.have.length.greaterThan(0);
}

describe("Tenant-Scoped Tables", () => {
  it("instance(undefined) throws", TenantUndefinedThrows);
  it("Insert stamps tenant_id", TenantInsertStamps);
  it("Tenant isolation", TenantIsolation);
  it("Cross-tenant query via CROSS_TENANT sees all", TenantCrossSeesAll);
  it("Cross-tenant insert throws", TenantCrossInsertThrows);
  it("Cross-tenant update touches every tenant", TenantCrossUpdate);
  it("Cross-tenant delete wipes every tenant", TenantCrossDelete);

  after(async () => {
    await tenantSchema.instance(CROSS_TENANT).table(tableName).delete().run();
  });
});

async function TenantUndefinedThrows() {
  let threw = false;
  try {
    await tenantSchema.instance().table(tableName).count().run();
  } catch {
    threw = true;
  }
  expect(threw).to.equal(true);
}

async function TenantInsertStamps() {
  const table = tenantSchema.instance("cleanup").table(tableName);
  const keys = await table.insert([vehicle("Peugeot", 3000)]).run();
  expect(keys).to.have.lengthOf(1);

  const doc = await table.get(keys[0]).run();
  expect(doc).to.have.property("tenant_id", "cleanup");
}

async function TenantIsolation() {
  const t1Table = tenantSchema.instance("t1").table(tableName);
  const t2Table = tenantSchema.instance("t2").table(tableName);

  await t1Table.insert([vehicle("Peugeot", 3000)]).run();
  await t2Table.insert([vehicle("Renault", 5000)]).run();

  const t1Docs = await t1Table.run();
  const t2Docs = await t2Table.run();
  expect(t1Docs).to.have.lengthOf(1);
  expect(t2Docs).to.have.lengthOf(1);
  expect(t1Docs[0].car).to.equal("Peugeot");
  expect(t2Docs[0].car).to.equal("Renault");
}

async function TenantCrossSeesAll() {
  const crossTable = tenantSchema.instance(CROSS_TENANT).table(tableName);
  const all = await crossTable.run();
  expect(all.length).to.be.greaterThanOrEqual(2);
  const cars = all.map((doc) => doc.car);
  expect(cars).to.include("Peugeot");
  expect(cars).to.include("Renault");
}

async function TenantCrossInsertThrows() {
  let threw = false;
  try {
    await tenantSchema
      .instance(CROSS_TENANT)
      .table(tableName)
      .insert([vehicle("Forbidden", 0)])
      .run();
  } catch {
    threw = true;
  }
  expect(threw).to.equal(true);
}

async function TenantCrossUpdate() {
  const crossTable = tenantSchema.instance(CROSS_TENANT).table(tableName);
  const before = await crossTable.run();
  expect(before.length).to.be.greaterThanOrEqual(2);

  const sentinel = 424242;
  await crossTable.update({ price: sentinel }).run();

  const t1Docs = await tenantSchema.instance("t1").table(tableName).run();
  const t2Docs = await tenantSchema.instance("t2").table(tableName).run();
  expect(t1Docs.length).to.be.greaterThan(0);
  expect(t2Docs.length).to.be.greaterThan(0);
  for (const doc of [...t1Docs, ...t2Docs]) {
    expect(doc.price).to.equal(sentinel);
  }
}

async function TenantCrossDelete() {
  const crossTable = tenantSchema.instance(CROSS_TENANT).table(tableName);
  await crossTable.delete().run();

  const remaining = await crossTable.run();
  expect(remaining).to.have.lengthOf(0);

  const t1Docs = await tenantSchema.instance("t1").table(tableName).run();
  const t2Docs = await tenantSchema.instance("t2").table(tableName).run();
  expect(t1Docs).to.have.lengthOf(0);
  expect(t2Docs).to.have.lengthOf(0);
}
