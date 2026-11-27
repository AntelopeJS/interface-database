import { expect } from "chai";
import { IsStagedObject, Schema, ValueProxy } from "..";

type Person = { _id?: string; name: string };

const schema = new Schema<{ people: Person }>("test-staged-object-guard", {
  people: { fields: { name: "string" }, indexes: {} },
});
const table = schema.instance("default").table("people");

describe("IsStagedObject", () => {
  it("Accepts every kind of staged object", () => {
    expect(IsStagedObject(table)).to.equal(true);
    expect(IsStagedObject(table.get("p-1"))).to.equal(true);
    expect(IsStagedObject(ValueProxy.arg<Person>(0).key("name"))).to.equal(
      true,
    );
  });

  it("Rejects a structural look-alike, null and primitives", () => {
    expect(IsStagedObject({ stages: [], build: () => [] })).to.equal(false);
    expect(IsStagedObject(null)).to.equal(false);
    expect(IsStagedObject("table")).to.equal(false);
  });
});
