const { expect } = require("chai");

const { ValidateAtomicMutation } = require("../index");

const update = {
  type: "update",
  revisionField: "revision",
  expectedRevision: "observed",
  nextRevision: "fresh",
  patch: { details: { count: 3 } },
};

describe("Atomic mutation runtime refusal of off-contract values", () => {
  it("refuses a null, undefined, empty or extended expected revision", () => {
    for (const expectedRevision of [
      null,
      undefined,
      "",
      { kind: "missing", extra: true },
    ]) {
      expect(() =>
        ValidateAtomicMutation("record-a", { ...update, expectedRevision }),
      ).to.throw(TypeError);
    }
  });

  it("refuses a non-scalar or invalid expected value", () => {
    for (const expectedValue of [null, undefined, {}, [], NaN, new Date(NaN)]) {
      expect(() =>
        ValidateAtomicMutation("record-a", {
          type: "deleteIfEqual",
          field: "title",
          expectedValue,
        }),
      ).to.throw(TypeError);
    }
  });
});
