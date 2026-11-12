import { expect } from "chai";
import { Schema } from "..";

interface Article {
  _id: string;
  title: { fr: string; en: string };
  meta: { rank: number; sku: string };
}

interface ArticleOrder {
  _id: string;
  articleRef: string;
}

const articlesName = "articles";
const ordersName = "orders";

const schema = new Schema<{
  [articlesName]: Article;
  [ordersName]: ArticleOrder;
}>("test-dotted-paths", {
  [articlesName]: {
    fields: {
      title: { fr: "string", en: "string" },
      meta: { rank: "number", sku: "string" },
    },
    indexes: {
      title_fr: { fields: ["title.fr"] },
      "title.en": {},
      "meta.sku": {},
    },
  },
  [ordersName]: { fields: { articleRef: "string" }, indexes: {} },
});

const articles = schema.instance("default").table(articlesName);
const orders = schema.instance("default").table(ordersName);

const articlesData: Omit<Article, "_id">[] = [
  {
    title: { fr: "delta", en: "charlie" },
    meta: { rank: 3, sku: "SKU-A" },
  },
  {
    title: { fr: "alpha", en: "delta" },
    meta: { rank: 1, sku: "SKU-B" },
  },
  {
    title: { fr: "charlie", en: "bravo" },
    meta: { rank: 4, sku: "SKU-C" },
  },
  {
    title: { fr: "bravo", en: "alpha" },
    meta: { rank: 2, sku: "SKU-D" },
  },
];

const orderedSkus = ["SKU-C", "SKU-A", "SKU-D"];

let articleKeys: string[] = [];
let orderKeys: string[] = [];

describe("Dotted Paths", () => {
  before(async () => {
    await schema.createInstance("default").run();
    await orders.delete().run();
    await articles.delete().run();
  });

  after(async () => {
    await orders.delete().run();
    await articles.delete().run();
    await schema.destroyInstance("default").run();
  });

  it("Insert Test Data", InsertTestData);
  it(
    "getAll on an index whose fields entry is dotted finds the row by its nested value, not a literal top-level key",
    GetAllOnDottedField,
  );
  it(
    "getAll on a dotted index name without fields finds the row by its nested value, not a literal top-level key",
    GetAllOnDottedName,
  );
  it(
    "orderBy on an index with a dotted field sorts by the nested value, not in insertion order",
    OrderByIndexWithDottedField,
  );
  it(
    "orderBy on a dotted name that is no index sorts by the nested value, not in insertion order",
    OrderByDottedNameWithoutIndex,
  );
  it(
    "Stream lookup on a dotted otherKey matches the nested value, not a literal top-level key",
    StreamLookupOnDottedKey,
  );
  it(
    "Datum lookup on a dotted otherKey matches the nested value, not a literal top-level key",
    DatumLookupOnDottedKey,
  );
});

async function InsertTestData() {
  articleKeys = await articles.insert(articlesData).run();
  expect(articleKeys).to.have.lengthOf(articlesData.length);

  orderKeys = await orders
    .insert(orderedSkus.map((articleRef) => ({ articleRef })))
    .run();
  expect(orderKeys).to.have.lengthOf(orderedSkus.length);
}

async function GetAllOnDottedField() {
  const result = await articles.getAll("delta", "title_fr").run();

  expect(result.map((doc) => doc._id)).to.deep.equal([articleKeys[0]]);
}

async function GetAllOnDottedName() {
  const result = await articles.getAll("delta", "title.en").run();

  expect(result.map((doc) => doc._id)).to.deep.equal([articleKeys[1]]);
}

async function OrderByIndexWithDottedField() {
  const result = await articles.orderBy("title_fr", "asc").run();

  expect(result.map((doc) => doc._id)).to.deep.equal([
    articleKeys[1],
    articleKeys[3],
    articleKeys[2],
    articleKeys[0],
  ]);
}

async function OrderByDottedNameWithoutIndex() {
  const result = await articles.orderBy("meta.rank", "desc").run();

  expect(result.map((doc) => doc._id)).to.deep.equal([
    articleKeys[2],
    articleKeys[0],
    articleKeys[3],
    articleKeys[1],
  ]);
}

async function StreamLookupOnDottedKey() {
  const result = await orders.lookup(articles, "articleRef", "meta.sku").run();

  expect(result).to.have.lengthOf(orderedSkus.length);
  const expectedArticles = [articleKeys[2], articleKeys[0], articleKeys[3]];
  orderKeys.forEach((orderKey, index) => {
    const doc = result.find((candidate) => candidate._id === orderKey);
    expect(doc?.articleRef).to.have.property("_id", expectedArticles[index]);
  });
}

async function DatumLookupOnDottedKey() {
  const result = await orders
    .get(orderKeys[1])
    .lookup(articles, "articleRef", "meta.sku")
    .run();

  expect(result.articleRef).to.have.property("_id", articleKeys[0]);
  expect(result.articleRef.meta).to.have.property("sku", "SKU-A");
}
