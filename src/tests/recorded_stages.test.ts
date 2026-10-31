import { expect } from "chai";
import { Schema, ValueProxy } from "..";

type Person = {
  _id?: string;
  name: string;
  age: number;
  bornAt: Date;
  tags: string[];
  scores: number[];
};

const schema = new Schema<{ people: Person }>("test-recorded-stages", {
  people: {
    fields: {
      name: "string",
      age: "number",
      bornAt: "date",
      tags: "string[]",
      scores: "number[]",
    },
    indexes: {},
  },
});
const table = schema.instance("default").table("people");
const row = ValueProxy.arg<Person>(0);

describe("Recorded stages", () => {
  it("Records the string operand of add on a string", () => {
    expect(row.key("name").add("!").build().at(-1)).to.deep.equal({
      stage: "add",
      options: undefined,
      args: ["!"],
    });
  });

  it("Records the list operand of add on a list", () => {
    expect(row.key("tags").add(["x"]).build().at(-1)).to.deep.equal({
      stage: "add",
      options: undefined,
      args: [["x"]],
    });
  });

  it("Records a null operand of add", () => {
    expect(row.key("age").add(null).build().at(-1)).to.deep.equal({
      stage: "add",
      options: undefined,
      args: [null],
    });
  });

  it("Records numeric bounds of during", () => {
    expect(row.key("bornAt").during(0, 1).build().at(-1)).to.deep.equal({
      stage: "date_during",
      options: undefined,
      args: [0, 1],
    });
  });

  it("Records an expression key on a stream", () => {
    const field = ValueProxy.constant<"name">("name");
    expect(table.key(field).build().at(-1)).to.deep.equal({
      stage: "key",
      options: undefined,
      args: [field, undefined],
    });
  });

  it("Records the bounds of between", () => {
    const low = new Date(0);
    const high = new Date(1);
    expect(table.between("bornAt", low, high).build().at(-1)).to.deep.equal({
      stage: "between",
      options: { index: "bornAt" },
      args: [low, high],
    });
  });
});
