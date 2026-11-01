import { expect } from "chai";
import { Schema, ValueProxy } from "..";
import { IsQueryValue } from "../common";

type Person = { name: string };

const schema = new Schema<{ people: Person }>("test-is-query-value", {
  people: { fields: { name: "string" }, indexes: {} },
});
const people = schema.instance("default").table("people");

type Chain = { next: Chain[] };

function chain(depth: number) {
  let tail: Chain = { next: [] };
  for (let level = 0; level < depth; level += 1) {
    tail = { next: [tail] };
  }
  return tail;
}

describe("IsQueryValue", () => {
  it("Accepts scalars, dates, lists and plain records of them", () => {
    const values = [
      "text",
      1.5,
      false,
      null,
      undefined,
      new Date(0),
      ["a", 1, [null]],
      { at: new Date(0), tags: ["a"], nested: { none: undefined } },
      Object.create(null),
    ];
    expect(values.map((value) => IsQueryValue(value))).to.deep.equal(
      values.map(() => true),
    );
  });

  it("Accepts a value proxy, a table and a query kept in a record", () => {
    const proxy = ValueProxy.constant(1);
    const values = [proxy, people, people.count(), { proxy, in: [people] }];
    expect(values.map((value) => IsQueryValue(value))).to.deep.equal(
      values.map(() => true),
    );
  });

  it("Refuses what no provider stores as given, wherever it sits", () => {
    const values = [
      1n,
      Symbol("x"),
      () => 1,
      new Map([["a", 1]]),
      new Set([1]),
      Buffer.from("a"),
      new (class Held {})(),
      [1, 1n],
      { deep: { list: [Symbol("y")] } },
    ];
    expect(values.map((value) => IsQueryValue(value))).to.deep.equal(
      values.map(() => false),
    );
  });

  it("Refuses a cyclic record and accepts a value held twice", () => {
    type Cyclic = { name: string; self?: Cyclic };
    const cyclic: Cyclic = { name: "a" };
    cyclic.self = cyclic;
    const shared = { n: 1 };
    expect([
      IsQueryValue(cyclic),
      IsQueryValue({ a: shared, b: [shared] }),
    ]).to.deep.equal([false, true]);
  });

  it("Walks a deeply nested value without exhausting the stack", () => {
    expect(IsQueryValue(chain(50_000))).to.equal(true);
  });
});
