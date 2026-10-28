import path from "node:path";
import { expect } from "chai";
import * as Database from "../staged-query";

import { CreateOtherInstance } from "./helpers/other-instance";

type DatabaseModule = typeof Database;

const buildFolder = path.resolve(__dirname, "..");
const otherInstance = CreateOtherInstance([buildFolder]);
const Other: DatabaseModule = otherInstance(
  path.join(buildFolder, "staged-query", "index.js"),
);

function OtherTable() {
  return new Other.Schema("cross-instance-other", {
    items: { fields: {}, indexes: {} },
  })
    .instance()
    .table("items");
}

describe("Objects built by another interface instance", () => {
  it(
    "IsStream, IsDatum, IsQuery and IsValueProxy recognise them (data-api picks its query path with them)",
    PredicatesRecogniseOtherInstance,
  );
  it(
    "are not instanceof this instance's classes (providers refuse sub-queries from another binding with it)",
    InstanceofStaysPerInstance,
  );
  it(
    "share CROSS_INSTANCE with this instance (providers compare it with ===)",
    CrossInstanceIsShared,
  );
});

function PredicatesRecogniseOtherInstance() {
  const otherTable = OtherTable();
  const otherDatum = otherTable.get("id");
  const otherValue = Other.ValueProxy.constant(1);
  expect(Other.Stream).to.not.equal(Database.Stream);
  expect(Database.IsStream(otherTable)).to.equal(true);
  expect(Database.IsQuery(otherTable)).to.equal(true);
  expect(Database.IsDatum(otherTable)).to.equal(false);
  expect(Database.IsDatum(otherDatum)).to.equal(true);
  expect(Database.IsStream(otherDatum)).to.equal(false);
  expect(Database.IsValueProxy(otherValue)).to.equal(true);
  expect(Database.IsQuery(otherValue)).to.equal(false);
  expect(Database.IsStream({})).to.equal(false);
  expect(Database.IsStream(null)).to.equal(false);
}

function InstanceofStaysPerInstance() {
  expect(OtherTable() instanceof Database.Query).to.equal(false);
  expect(Other.ValueProxy.constant(1) instanceof Database.ValueProxy).to.equal(
    false,
  );
}

function CrossInstanceIsShared() {
  expect(Other.CROSS_INSTANCE).to.equal(Database.CROSS_INSTANCE);
}
