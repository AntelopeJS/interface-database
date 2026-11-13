import { expect } from "chai";
import { Schema } from "..";

const schema = new Schema<{ items: { _id?: string; n: number } }>(
  "test-query-execution",
  { items: { fields: { n: "number" }, indexes: {} } },
);
const items = schema.instance().table("items");

describe("Query execution", () => {
  it("Awaiting a query gives back the query and runs nothing", AwaitTest);
});

async function AwaitTest() {
  const count = items.count();
  expect("then" in count).to.equal(false);
  expect(await Promise.resolve(count)).to.equal(count);
}
