import { expect } from "chai";
import { ValueProxy } from "..";
import type { QueryValue } from "../common";
import type { Same } from "./helpers/same-type";

type Person = {
  name: string;
  age: number;
  bornAt: Date | null;
  address: { street: string };
  tags: string[];
};

const row = ValueProxy.arg<Person>(0);

describe("Query values", () => {
  it("Records a nested record operand as it was given", () => {
    const operand: QueryValue = {
      at: new Date(0),
      tags: ["a", null],
      nested: { n: 1, none: undefined },
    };
    expect(ValueProxy.constant(operand).build().at(-1)).to.deep.equal({
      stage: "constant",
      options: undefined,
      args: [operand],
    });
  });

  it("Keeps the widened type of a constant", () => {
    const proxy = ValueProxy.constant(25);
    const widened: Same<typeof proxy, ValueProxy<number>> = true;
    expect(proxy.build().at(-1)).to.deep.equal({
      stage: "constant",
      options: undefined,
      args: [25],
    });
    expect(widened).to.equal(true);
  });

  it("Records a record operand of eq on a record field", () => {
    expect(
      row.key("address").eq({ street: "Main" }).build().at(-1),
    ).to.deep.equal({
      stage: "eq",
      options: undefined,
      args: [{ street: "Main" }],
    });
  });

  it("Records a null operand of default on a nullable date", () => {
    expect(row.key("bornAt").default(null).build().at(-1)).to.deep.equal({
      stage: "default",
      options: undefined,
      args: [null],
    });
  });

  it("Refuses a plain operand of a type no stage records", () => {
    type EqOf<T> = Parameters<ValueProxy<T>["eq"]>[0];
    const takes: [
      Same<[bigint] extends [EqOf<bigint>] ? true : false, false>,
      Same<[symbol] extends [EqOf<symbol>] ? true : false, false>,
      Same<[string] extends [EqOf<string>] ? true : false, true>,
    ] = [true, true, true];
    const age = row.key("age");
    expect(age.eq(age).build().at(-1)?.args).to.deep.equal([age]);
    expect(takes).to.have.length(3);
  });
});
