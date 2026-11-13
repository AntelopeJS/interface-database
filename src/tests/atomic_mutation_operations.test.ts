import { expect } from "chai";
import { randomUUID } from "node:crypto";
import {
  Schema,
  type AtomicDelete,
  type AtomicMutation,
  type AtomicUpdate,
  type AtomicEqualityValue,
} from "..";

interface NestedData {
  removed?: boolean;
  retained?: string;
  stage?: string;
  args?: string[];
  left?: boolean;
  right?: boolean;
}

interface AtomicRecord {
  _id: string;
  revision?: string | null;
  value: string;
  nested?: NestedData;
  equal?: AtomicEqualityValue | null;
  expires?: Date;
}

interface AtomicTables {
  records: AtomicRecord;
}

const schema = new Schema<AtomicTables>("atomic-provider-contract", {
  records: { fields: { value: "string", expires: "date" }, indexes: {} },
});
const owner = schema.instance("owner").table("records");
const other = schema.instance("other").table("records");
const defaults = schema.instance().table("records");
const initialRevision = "initial";
const raceRounds = 8;
const expiry = new Date("2026-01-05T10:00:00+02:00");
const sameExpiry = new Date("2026-01-05T08:00:00Z");
const differentExpiry = new Date("2026-01-05T08:00:01Z");

function Update(value: string): AtomicUpdate<AtomicRecord> {
  return {
    type: "update",
    revisionField: "revision",
    expectedRevision: initialRevision,
    nextRevision: `revision-${value}`,
    patch: { value },
  };
}

const deletion: AtomicDelete<AtomicRecord> = {
  type: "delete",
  revisionField: "revision",
  expectedRevision: initialRevision,
};
const equalityDeletion: AtomicMutation<AtomicRecord> = {
  type: "deleteIfEqual",
  field: "value",
  expectedValue: "original",
};

async function Insert(data: Partial<AtomicRecord> = {}) {
  const key = randomUUID();
  await owner
    .insert({
      _id: key,
      revision: initialRevision,
      value: "original",
      ...data,
    })
    .run();
  return key;
}

describe("Atomic mutation provider conformance", () => {
  before(async () => {
    await schema.createInstance("owner").run();
    await schema.createInstance("other").run();
    await schema.createInstance().run();
  });
  after(async () => {
    await schema.destroyInstance("owner").run();
    await schema.destroyInstance("other").run();
    await schema.destroyInstance().run();
  });
  it("persists revisions and replaces fields literally", ReplaceFields);
  it("advances revision when the payload is unchanged", UnchangedPatch);
  it("leaves stale updates and deletes unchanged", StaleRevision);
  it("never upserts missing identities for any mutation", MissingIdentity);
  it("isolates named and default instances", IsolateInstances);
  it("updates and deletes records in the default instance", DefaultInstance);
  it("bootstraps absence, never null or missing rows", MissingRevision);
  it("deletes only absent revisions", DeleteMissingRevision);
  it("preserves scalar types and checks equality at deletion", ScalarEquality);
  it("compares declared dates by instant", DateEquality);
  it("applies one competing update with its full patch", CompetingUpdates);
  it("serializes revision deletion against update", CompetingRevisionDelete);
  it("protects refreshes from scalar cleanup", CompetingEqualityDelete);
});

async function ReplaceFields() {
  const key = await Insert({ nested: { removed: true, retained: "old" } });
  expect((await owner.get(key).run()).revision).to.equal(initialRevision);
  const nested = { retained: "$literal", stage: "delete", args: ["data"] };
  const request = { ...Update("unused"), patch: { nested } };
  expect(await owner.atomicMutation(key, request).run()).to.equal("applied");
  const stored = await owner.get(key).run();
  expect(stored.nested).to.deep.equal(nested);
  expect(stored.value).to.equal("original");
  expect(stored.revision).to.equal(request.nextRevision);
}

async function UnchangedPatch() {
  const key = await Insert();
  expect(await owner.atomicMutation(key, Update("original")).run()).to.equal(
    "applied",
  );
  expect(await owner.get(key).run()).to.include({
    value: "original",
    revision: "revision-original",
  });
}

async function StaleRevision() {
  const key = await Insert();
  const count = await owner.count().run();
  expect(await owner.atomicMutation(key, Update("fresh")).run()).to.equal(
    "applied",
  );
  expect(await owner.atomicMutation(key, Update("stale")).run()).to.equal(
    "not-applied",
  );
  expect(await owner.atomicMutation(key, deletion).run()).to.equal(
    "not-applied",
  );
  expect(await owner.count().run()).to.equal(count);
  expect(await owner.get(key).run()).to.include({
    value: "fresh",
    revision: "revision-fresh",
  });
  expect(
    await owner
      .atomicMutation(key, {
        ...deletion,
        expectedRevision: "revision-fresh",
      })
      .run(),
  ).to.equal("applied");
  expect(await owner.get(key).run()).to.equal(undefined);
  expect(await owner.count().run()).to.equal(count - 1);
  expect(await owner.atomicMutation(key, deletion).run()).to.equal(
    "not-applied",
  );
}

async function MissingIdentity() {
  const key = randomUUID();
  const count = await owner.count().run();
  for (const request of [Update("absent"), deletion, equalityDeletion]) {
    expect(await owner.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
    expect(await owner.get(key).run()).to.equal(undefined);
    expect(await owner.count().run()).to.equal(count);
  }
}

async function IsolateInstances() {
  const key = await Insert();
  const ownerCount = await owner.count().run();
  for (const table of [other, defaults]) {
    const count = await table.count().run();
    for (const request of [Update("intruder"), deletion, equalityDeletion]) {
      expect(await table.atomicMutation(key, request).run()).to.equal(
        "not-applied",
      );
      expect(await table.get(key).run()).to.equal(undefined);
      expect(await table.count().run()).to.equal(count);
      expect(await owner.count().run()).to.equal(ownerCount);
      expect(await owner.get(key).run()).to.include({
        value: "original",
        revision: initialRevision,
      });
    }
  }
}

async function DefaultInstance() {
  const key = randomUUID();
  expect(await defaults.atomicMutation(key, Update("default")).run()).to.equal(
    "not-applied",
  );
  await defaults
    .insert({
      _id: key,
      revision: initialRevision,
      value: "original",
    })
    .run();
  expect(await defaults.atomicMutation(key, Update("default")).run()).to.equal(
    "applied",
  );
  expect(await defaults.get(key).run()).to.include({
    value: "default",
    revision: "revision-default",
  });
  expect(
    await defaults
      .atomicMutation(key, {
        ...deletion,
        expectedRevision: "revision-default",
      })
      .run(),
  ).to.equal("applied");
  expect(await defaults.get(key).run()).to.equal(undefined);
}

async function MissingRevision() {
  const absent = randomUUID();
  const storedNull = await Insert({ revision: null });
  const missingRow = randomUUID();
  await owner.insert({ _id: absent, value: "legacy" }).run();
  const request: AtomicUpdate<AtomicRecord> = {
    ...Update("adopted"),
    expectedRevision: { kind: "missing" },
  };
  for (const key of [storedNull, missingRow]) {
    expect(await owner.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
  }
  expect(await owner.atomicMutation(absent, request).run()).to.equal("applied");
  expect(await owner.atomicMutation(absent, request).run()).to.equal(
    "not-applied",
  );
  expect(await owner.get(absent).run()).to.include({
    value: "adopted",
    revision: "revision-adopted",
  });
  expect((await owner.get(storedNull).run()).revision).to.equal(null);
  expect(await owner.get(missingRow).run()).to.equal(undefined);
}

async function DeleteMissingRevision() {
  const absent = randomUUID();
  const storedNull = await Insert({ revision: null });
  const present = await Insert();
  const missingRow = randomUUID();
  await owner.insert({ _id: absent, value: "legacy" }).run();
  const request: AtomicMutation<AtomicRecord> = {
    ...deletion,
    expectedRevision: { kind: "missing" },
  };
  for (const key of [storedNull, present, missingRow]) {
    expect(await owner.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
  }
  expect(await owner.atomicMutation(absent, request).run()).to.equal("applied");
  expect(await owner.get(absent).run()).to.equal(undefined);
  expect((await owner.get(storedNull).run()).revision).to.equal(null);
  expect((await owner.get(present).run()).revision).to.equal(initialRevision);
  expect(await owner.get(missingRow).run()).to.equal(undefined);
}

async function ScalarEquality() {
  for (const expectedValue of ["saved", 0, false]) {
    const key = await Insert();
    const request: AtomicMutation<AtomicRecord> = {
      type: "deleteIfEqual",
      field: "equal",
      expectedValue,
    };
    expect(await owner.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
    await owner.get(key).update({ equal: null }).run();
    expect(await owner.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
    await owner.get(key).update({ equal: expectedValue }).run();
    expect(await other.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
    expect(
      await owner
        .atomicMutation(key, {
          ...request,
          expectedValue: `${expectedValue}-different`,
        })
        .run(),
    ).to.equal("not-applied");
    expect(
      await owner
        .atomicMutation(key, {
          ...request,
          expectedValue: expectedValue === 0 ? "0" : 0,
        })
        .run(),
    ).to.equal("not-applied");
    expect((await owner.get(key).run()).equal).to.equal(expectedValue);
    expect(await owner.atomicMutation(key, request).run()).to.equal("applied");
    expect(await owner.get(key).run()).to.equal(undefined);
    expect(await owner.atomicMutation(key, request).run()).to.equal(
      "not-applied",
    );
  }
}

async function DateEquality() {
  const key = await Insert();
  const request: AtomicMutation<AtomicRecord> = {
    type: "deleteIfEqual",
    field: "expires",
    expectedValue: sameExpiry,
  };
  expect(await owner.atomicMutation(key, request).run()).to.equal(
    "not-applied",
  );
  await owner.get(key).update({ expires: expiry }).run();
  expect(
    await owner
      .atomicMutation(key, {
        ...request,
        expectedValue: differentExpiry,
      })
      .run(),
  ).to.equal("not-applied");
  expect((await owner.get(key).run()).expires).to.deep.equal(expiry);
  expect(await owner.atomicMutation(key, request).run()).to.equal("applied");
  expect(await owner.get(key).run()).to.equal(undefined);
}

async function CompetingUpdates() {
  for (let round = 0; round < raceRounds; round++) {
    const key = await Insert();
    const requests = [Update("left"), Update("right")];
    requests[0].patch.nested = { left: true };
    requests[1].patch.nested = { right: true };
    const outcomes = await Promise.all(
      requests.map((request) => owner.atomicMutation(key, request).run()),
    );
    expect([...outcomes].sort()).to.deep.equal(["applied", "not-applied"]);
    const winner = requests[outcomes.indexOf("applied")];
    expect(await owner.get(key).run()).to.include({
      revision: winner.nextRevision,
      value: winner.patch.value,
    });
    expect((await owner.get(key).run()).nested).to.deep.equal(
      winner.patch.nested,
    );
  }
}

async function CompeteDeletion(request: AtomicMutation<AtomicRecord>) {
  const requests = [request, Update("refreshed")];
  for (let round = 0; round < raceRounds; round++) {
    const key = await Insert();
    requests.reverse();
    const outcomes = await Promise.all(
      requests.map((mutation) => owner.atomicMutation(key, mutation).run()),
    );
    expect([...outcomes].sort()).to.deep.equal(["applied", "not-applied"]);
    const stored = await owner.get(key).run();
    if (requests[outcomes.indexOf("applied")].type !== "update") {
      expect(stored).to.equal(undefined);
      continue;
    }
    expect(stored).to.include({
      value: "refreshed",
      revision: "revision-refreshed",
    });
  }
}

async function CompetingRevisionDelete() {
  await CompeteDeletion(deletion);
}

async function CompetingEqualityDelete() {
  await CompeteDeletion(equalityDeletion);
}
