import { CROSS_INSTANCE, Schema } from "@antelopejs/interface-database";
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

const schema = new Schema<{ [tableName]: Vehicle }>("test-im-instances", {
  [tableName]: Vehicle,
});

describe("Instance Lifecycle", () => {
  before(async () => {
    await schema.createInstance().run();
  });

  it("createInstance returns the created ID", CreateReturnsId);
  it("listInstances enumerates named instances", ListEnumerates);
  it("listInstances excludes the default instance", ListExcludesDefault);
  it("destroyInstance removes the instance", DestroyRemoves);

  after(async () => {
    await schema.instance(CROSS_INSTANCE).table(tableName).delete().run();
    for (const id of await schema.listInstances().run()) {
      await schema.destroyInstance(id).run();
    }
    await schema.destroyInstance().run();
  });
});

async function CreateReturnsId() {
  const id = await schema.createInstance("alpha").run();
  expect(id).to.equal("alpha");
}

async function ListEnumerates() {
  await schema.createInstance("beta").run();
  const ids = await schema.listInstances().run();
  expect(ids).to.include("alpha");
  expect(ids).to.include("beta");
}

async function ListExcludesDefault() {
  await schema
    .instance()
    .table(tableName)
    .insert([vehicle("Default", 1)])
    .run();
  const ids = await schema.listInstances().run();
  expect(ids).to.not.include(undefined);
  expect(ids).to.not.include("");
}

async function DestroyRemoves() {
  await schema.destroyInstance("beta").run();
  const ids = await schema.listInstances().run();
  expect(ids).to.not.include("beta");
}

describe("Instance Isolation", () => {
  before(async () => {
    await schema.createInstance().run();
    await schema.createInstance("t1").run();
    await schema.createInstance("t2").run();
    await schema.createInstance("named").run();
  });

  it("named instances are isolated", NamedIsolated);
  it("default and named instances are isolated", DefaultIsolatedFromNamed);

  after(async () => {
    await schema.instance(CROSS_INSTANCE).table(tableName).delete().run();
    await schema.destroyInstance("t1").run();
    await schema.destroyInstance("t2").run();
    await schema.destroyInstance("named").run();
    await schema.destroyInstance().run();
  });
});

async function NamedIsolated() {
  const t1Table = schema.instance("t1").table(tableName);
  const t2Table = schema.instance("t2").table(tableName);

  await t1Table.insert([vehicle("Peugeot", 3000)]).run();
  await t2Table.insert([vehicle("Renault", 5000)]).run();

  const t1Docs = await t1Table.run();
  const t2Docs = await t2Table.run();
  expect(t1Docs).to.have.lengthOf(1);
  expect(t2Docs).to.have.lengthOf(1);
  expect(t1Docs[0].car).to.equal("Peugeot");
  expect(t2Docs[0].car).to.equal("Renault");
}

async function DefaultIsolatedFromNamed() {
  const defaultTable = schema.instance().table(tableName);
  const namedTable = schema.instance("named").table(tableName);

  await defaultTable.insert([vehicle("DefaultCar", 100)]).run();
  await namedTable.insert([vehicle("NamedCar", 200)]).run();

  const defaultDocs = await defaultTable.run();
  const namedDocs = await namedTable.run();
  expect(defaultDocs.map((d) => d.car)).to.include("DefaultCar");
  expect(defaultDocs.map((d) => d.car)).to.not.include("NamedCar");
  expect(namedDocs.map((d) => d.car)).to.include("NamedCar");
  expect(namedDocs.map((d) => d.car)).to.not.include("DefaultCar");
}

describe("CROSS_INSTANCE", () => {
  before(async () => {
    await schema.createInstance("t1").run();
    await schema.createInstance("t2").run();
  });

  it("Read sees every instance", CrossReadSeesAll);
  it("Insert is rejected", CrossInsertThrows);
  it("Update touches every instance", CrossUpdateAll);
  it("Delete wipes every instance", CrossDeleteAll);

  after(async () => {
    await schema.instance(CROSS_INSTANCE).table(tableName).delete().run();
    await schema.destroyInstance("t1").run();
    await schema.destroyInstance("t2").run();
  });
});

async function CrossReadSeesAll() {
  await schema
    .instance("t1")
    .table(tableName)
    .insert([vehicle("Peugeot", 3000)])
    .run();
  await schema
    .instance("t2")
    .table(tableName)
    .insert([vehicle("Renault", 5000)])
    .run();

  const all = await schema.instance(CROSS_INSTANCE).table(tableName).run();
  const cars = all.map((doc) => doc.car);
  expect(cars).to.include("Peugeot");
  expect(cars).to.include("Renault");
}

async function CrossInsertThrows() {
  let threw = false;
  try {
    await schema
      .instance(CROSS_INSTANCE)
      .table(tableName)
      .insert([vehicle("Forbidden", 0)])
      .run();
  } catch {
    threw = true;
  }
  expect(threw).to.equal(true);
}

async function CrossUpdateAll() {
  const crossTable = schema.instance(CROSS_INSTANCE).table(tableName);
  const sentinel = 424242;
  await crossTable.update({ price: sentinel }).run();

  const t1Docs = await schema.instance("t1").table(tableName).run();
  const t2Docs = await schema.instance("t2").table(tableName).run();
  expect(t1Docs.length).to.be.greaterThan(0);
  expect(t2Docs.length).to.be.greaterThan(0);
  for (const doc of [...t1Docs, ...t2Docs]) {
    expect(doc.price).to.equal(sentinel);
  }
}

async function CrossDeleteAll() {
  const crossTable = schema.instance(CROSS_INSTANCE).table(tableName);
  await crossTable.delete().run();

  const remaining = await crossTable.run();
  expect(remaining).to.have.lengthOf(0);

  const t1Docs = await schema.instance("t1").table(tableName).run();
  const t2Docs = await schema.instance("t2").table(tableName).run();
  expect(t1Docs).to.have.lengthOf(0);
  expect(t2Docs).to.have.lengthOf(0);
}
