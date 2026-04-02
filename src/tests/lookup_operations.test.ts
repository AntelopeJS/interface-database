import { Schema } from "@antelopejs/interface-database";
import { expect } from "chai";
import { getUniqueOrders, Order } from "./datasets/orders";
import { getUniqueProducts, Product } from "./datasets/products";
import { getUniqueUsers, User } from "./datasets/users";

type OrderWithRefs = Order & { productIds?: string[] };

const ordersTableName = "orders";
const usersTableName = "users";
const productsTableName = "products";

const ProductWithSkuIndex = {
  ...Product,
  indexes: { ...Product.indexes, sku: {} },
};

const schema = new Schema<{
  [ordersTableName]: OrderWithRefs;
  [usersTableName]: User;
  [productsTableName]: Product;
}>("test-lookup-operations", {
  [ordersTableName]: Order,
  [usersTableName]: User,
  [productsTableName]: ProductWithSkuIndex,
});

const ordersTable = schema.instance("default").table(ordersTableName);
const usersTable = schema.instance("default").table(usersTableName);
const productsTable = schema.instance("default").table(productsTableName);

const usersData = getUniqueUsers();
const ordersData = getUniqueOrders();
const productsData = getUniqueProducts();

const insertedKeys: {
  users: string[];
  orders: string[];
  products: string[];
} = {
  users: [],
  orders: [],
  products: [],
};

describe("Lookup Operations", () => {
  before(async () => {
    await schema.createInstance("default").run();
    await ordersTable.delete().run();
    await usersTable.delete().run();
    await productsTable.delete().run();
  });

  after(async () => {
    await ordersTable.delete().run();
    await usersTable.delete().run();
    await productsTable.delete().run();
    await schema.destroyInstance("default").run();
  });

  it("Insert Test Data", InsertTestData);
  it("Lookup Basic", LookupBasic);
  it("Lookup On Get", LookupOnGet);
  it("Lookup With Filter", LookupWithFilter);
  it("Lookup with Subquery Inside Map", LookupWithSubqueryInsideMap);
  it("Chained Lookup", ChainedLookup);
  it("Cleanup", CleanupTest);
});

async function InsertTestData() {
  const usersResponse = await usersTable.insert(usersData).run();
  const ordersResponse = await ordersTable.insert(ordersData).run();
  const productsResponse = await productsTable.insert(productsData).run();

  expect(usersResponse).to.be.an("array");
  expect(ordersResponse).to.be.an("array");
  expect(productsResponse).to.be.an("array");

  insertedKeys.users = usersResponse;
  insertedKeys.orders = ordersResponse;
  insertedKeys.products = productsResponse;
}

async function LookupBasic() {
  const result = await ordersTable
    .lookup(usersTable, "customerName", "name")
    .run();

  expect(result).to.be.an("array");
  expect(result).to.have.lengthOf(ordersData.length);

  result.forEach((doc) => {
    expect(doc).to.have.property("customerName");
    const customerName = doc.customerName;
    expect(customerName).to.be.an("object");
    expect(customerName).to.have.property("name");
    expect(customerName).to.have.property("age");
    expect(customerName).to.have.property("email");
    expect(customerName).to.have.property("isActive");
  });

  const antoineOrder = result.find((doc) => doc.orderId === "ORD-001");
  expect(antoineOrder).to.not.equal(undefined);
  expect(antoineOrder?.customerName).to.have.property("name", "Antoine");
  expect(antoineOrder?.customerName).to.have.property("age", 25);
}

async function LookupOnGet() {
  const result = await ordersTable
    .get(insertedKeys.orders[0])
    .lookup(usersTable, "customerName", "name")
    .run();

  expect(result).to.have.property("customerName");
  const customerName = result.customerName;
  expect(customerName).to.be.an("object");
  expect(customerName).to.have.property("name");
  expect(customerName).to.have.property("age");
  expect(customerName).to.have.property("email");
  expect(customerName).to.have.property("isActive");

  expect(result?.customerName).to.have.property("name", "Antoine");
  expect(result?.customerName).to.have.property("age", 25);
}

async function LookupWithFilter() {
  const result = await ordersTable
    .lookup(usersTable, "customerName", "name")
    .filter((doc) => doc.key("isPaid").eq(true))
    .run();

  expect(result).to.be.an("array");
  const expectedCount = ordersData.filter((o) => o.isPaid).length;
  expect(result).to.have.lengthOf(expectedCount);

  result.forEach((doc) => {
    expect(doc.isPaid).to.equal(true);
    expect(doc.customerName).to.be.an("object");
    expect(doc.customerName).to.have.property("name");
  });
}

async function LookupWithSubqueryInsideMap() {
  const productIds = insertedKeys.products.slice(0, 2);
  await ordersTable.get(insertedKeys.orders[0]).update({ productIds }).run();

  const result = await ordersTable
    .get(insertedKeys.orders[0])
    .do((order) =>
      order.merge({
        resolvedProducts: order
          .key("productIds")
          .map((pid) => productsTable.get(pid as any)),
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("resolvedProducts");
  expect(result.resolvedProducts).to.be.an("array");
  expect(result.resolvedProducts).to.have.lengthOf(productIds.length);

  result.resolvedProducts.forEach((product) => {
    expect(product).to.be.an("object");
    expect(product).to.have.property("name");
    expect(product).to.have.property("price");
    expect(product).to.have.property("sku");
  });
}

async function ChainedLookup() {
  const result = await ordersTable
    .lookup(usersTable, "customerName", "name")
    .lookup(productsTable, "productSku", "sku")
    .run();

  expect(result).to.be.an("array");
  expect(result).to.have.lengthOf(ordersData.length);

  const antoineOrder = result.find((doc) => doc.orderId === "ORD-001");
  expect(antoineOrder).to.not.equal(undefined);
  expect(antoineOrder?.customerName).to.be.an("object");
  expect(antoineOrder?.customerName).to.have.property("name", "Antoine");
  expect(antoineOrder?.productSku).to.be.an("object");
  expect(antoineOrder?.productSku).to.have.property("sku", "LAPTOP-001");
}

async function CleanupTest() {
  for (const key of insertedKeys.orders) {
    await ordersTable.get(key).delete().run();
  }
  for (const key of insertedKeys.users) {
    await usersTable.get(key).delete().run();
  }
  for (const key of insertedKeys.products) {
    await productsTable.get(key).delete().run();
  }
}
