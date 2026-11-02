import { expect } from "chai";
import type { FieldType, StringFieldType } from "../schema";
import type { Same } from "./helpers/same-type";

type IsAny<T> = 0 extends 1 & T ? true : false;

type Codec = Exclude<FieldType, StringFieldType>;

function propertiesOf(codec: Codec) {
  return Object.entries(codec);
}

type PropertyValue = ReturnType<typeof propertiesOf>[number][1];

const valuesAreNotAny: Same<IsAny<PropertyValue>, false> = true;
const valuesAreUnknown: Same<PropertyValue, unknown> = true;

describe("Field types", () => {
  it("Types the own properties of a codec as unknown values", () => {
    const codec: Codec = {
      _A: 0,
      _O: 0,
      _I: 0,
      name: "number",
      is: (u): boolean => u === 0,
      encode: (a) => a,
      decode: () => ({ _tag: "Right" }),
    };
    const names = propertiesOf(codec).map(([name]) => name);
    expect(names).to.include.members(["name", "is", "encode", "decode"]);
    expect(valuesAreNotAny).to.equal(true);
    expect(valuesAreUnknown).to.equal(true);
  });
});
