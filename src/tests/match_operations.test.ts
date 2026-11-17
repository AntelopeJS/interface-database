import { expect } from "chai";
import { Schema } from "..";

type Cell = string | number | boolean | null | string[] | { text: string };

type Row = { _id?: string; label: string; value: Cell };

const tableName = "cells";
const schema = new Schema<{ [tableName]: Row }>("test-match-operations", {
  [tableName]: { fields: { label: "string" }, indexes: {} },
});
const table = schema.instance("default").table(tableName);

const rows: Row[] = [
  { label: "string", value: "text" },
  { label: "number", value: 42 },
  { label: "boolean", value: true },
  { label: "null", value: null },
  { label: "array", value: ["text"] },
  { label: "object", value: { text: "text" } },
];

describe("Match Operations", () => {
  before(async () => {
    await schema.createInstance("default").run();
    await table.insert(rows).run();
  });

  after(async () => {
    await table.delete().run();
    await schema.destroyInstance("default").run();
  });

  it(
    "match() answers false on every non-text cell of a mixed-type column, not a match of its text rendering nor an error",
    MatchAnswersFalseOnNonText,
  );
  it(
    "filter() with match() keeps only the text cell of a mixed-type column",
    FilterWithMatchKeepsOnlyText,
  );
});

async function MatchAnswersFalseOnNonText() {
  const result = await table
    .map((doc) => ({
      label: doc.key("label"),
      matched: doc.key("value").match("."),
    }))
    .run();
  const matchedByLabel = Object.fromEntries(
    result.map((row) => [row.label, row.matched]),
  );
  expect(matchedByLabel).to.deep.equal({
    string: true,
    number: false,
    boolean: false,
    null: false,
    array: false,
    object: false,
  });
}

async function FilterWithMatchKeepsOnlyText() {
  const result = await table.filter((doc) => doc.key("value").match(".")).run();
  expect(result.map((row) => row.label)).to.deep.equal(["string"]);
}
