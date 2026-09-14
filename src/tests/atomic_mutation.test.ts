import { expect } from "chai";
import type { InstanceId, Table } from "@antelopejs/interface-database";

import { QueryStage, StagedObject } from "../common";
import {
  AtomicMutationUnsupportedError,
  CROSS_INSTANCE,
  Query,
  SchemaInstance,
  ValidateAtomicMutation,
  ValueProxy,
  type AtomicMutation,
  type AtomicMutationOutcome,
  type AtomicUpdate,
} from "../index";

interface RecordData {
  revision?: string;
  title: string;
  details: Record<string, unknown>;
}

interface TestTables {
  records: RecordData;
}

function Instance(id?: InstanceId) {
  return new SchemaInstance<TestTables>(
    QueryStage("instance", { id }),
    new StagedObject(QueryStage("schema", { id: "atomic-contract" })),
  );
}

const table = Instance("tenant-a").table("records");
const request: AtomicUpdate<RecordData> = {
  type: "update",
  revisionField: "revision",
  expectedRevision: "observed",
  nextRevision: "fresh",
  patch: { details: { count: 3 } },
};

describe("Atomic mutation interface contract", () => {
  it("encodes one literal identity and constant operation", EncodeMutation);
  it(
    "accepts missing-only bootstrap, not null or empty revisions",
    ValidateRevision,
  );
  it(
    "rejects identity, revision and adapter-owned fields",
    ValidateProtectedFields,
  );
  it("rejects expressions and undefined even in nested patches", ValidatePatch);
  it("rejects cross-instance scope and cursor execution", ValidateScope);
  it("accepts only scalar equality deletion", ValidateEquality);
  it("preserves all outcomes and never retries unknown", PreserveOutcomes);
  it(
    "fails closed on legacy results and preserves errors",
    RejectLegacyResults,
  );
  it("exposes type-safe consumer shapes", CheckConsumerTypes);
  it("rejects noncanonical terminal stages before dispatch", ValidateTerminal);
});

function EncodeMutation() {
  const query: Query<AtomicMutationOutcome> = table.atomicMutation(
    "record-a",
    request,
  );
  expect(query.build()).to.deep.equal([
    { stage: "schema", options: { id: "atomic-contract" }, args: [] },
    { stage: "instance", options: { id: "tenant-a" }, args: [] },
    { stage: "table", options: { id: "records" }, args: [] },
    {
      stage: "atomicMutation",
      options: undefined,
      args: ["record-a", request],
    },
  ]);
  expect(table.build()).to.have.length(3);
}

function ValidateRevision() {
  expect(() =>
    table.atomicMutation("record-a", {
      ...request,
      expectedRevision: { kind: "missing" },
    }),
  ).not.to.throw();
  for (const expectedRevision of [
    null,
    undefined,
    "",
    { kind: "missing", extra: true },
  ]) {
    expect(() =>
      ValidateAtomicMutation("record-a", {
        ...request,
        expectedRevision,
      } as AtomicMutation<RecordData>),
    ).to.throw(TypeError);
  }
  expect(() =>
    table.atomicMutation("record-a", {
      ...request,
      nextRevision: "observed",
    }),
  ).to.throw(TypeError);
}

function ValidateProtectedFields() {
  for (const field of ["id", "_id", "revision", "tenant_id"]) {
    expect(() =>
      ValidateAtomicMutation(
        "record-a",
        {
          ...request,
          patch: { [field]: "changed" },
        },
        ["tenant_id"],
      ),
    ).to.throw(TypeError);
  }
  expect(() =>
    ValidateAtomicMutation<Record<string, unknown>>(
      "record-a",
      {
        ...request,
        revisionField: "tenant_id",
      },
      ["tenant_id"],
    ),
  ).to.throw(TypeError);
}

function ValidatePatch() {
  const sparse: unknown[] = [];
  sparse.length = 1;
  for (const value of [
    undefined,
    () => true,
    ValueProxy.constant(1),
    Infinity,
    sparse,
  ]) {
    expect(() =>
      table.atomicMutation("record-a", {
        ...request,
        patch: { details: { nested: [value] } },
      }),
    ).to.throw(TypeError);
  }
  expect(() =>
    table.atomicMutation("record-a", {
      ...request,
      patch: { details: { date: new Date("2026-01-01"), nil: null } },
    }),
  ).not.to.throw();
}

function ValidateScope() {
  expect(() =>
    Instance(CROSS_INSTANCE)
      .table("records")
      .atomicMutation("record-a", request),
  ).to.throw(TypeError);
  expect(() =>
    Instance().table("records").atomicMutation("record-a", request),
  ).not.to.throw();
  expect(() => table.atomicMutation("record-a", request).cursor()).to.throw(
    TypeError,
  );
  expect(() =>
    table.filter(() => true).atomicMutation("record-a", request),
  ).to.throw(TypeError);
}

function ValidateEquality() {
  for (const expectedValue of ["", false, 0, new Date("2026-01-01")]) {
    expect(() =>
      table.atomicMutation("record-a", {
        type: "deleteIfEqual",
        field: "title",
        expectedValue,
      }),
    ).not.to.throw();
  }
  for (const expectedValue of [null, undefined, {}, [], NaN, new Date(NaN)]) {
    expect(() =>
      ValidateAtomicMutation("record-a", {
        type: "deleteIfEqual",
        field: "title",
        expectedValue,
      } as AtomicMutation<RecordData>),
    ).to.throw(TypeError);
  }
}

async function WithResult(result: unknown, check: () => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(Query.prototype, "run")!;
  let calls = 0;
  Query.prototype.run = () => {
    calls++;
    return Promise.resolve(result as never);
  };
  try {
    await check();
    expect(calls).to.equal(1);
  } finally {
    Object.defineProperty(Query.prototype, "run", original);
  }
}

async function PreserveOutcomes() {
  for (const result of ["applied", "not-applied", "unknown"]) {
    await WithResult(result, async () => {
      expect(await table.atomicMutation("record-a", request)).to.equal(result);
    });
  }
}

async function RejectLegacyResults() {
  for (const result of [undefined, 0, 1, {}, []]) {
    await WithResult(result, async () => {
      const error = await table
        .atomicMutation("record-a", request)
        .run()
        .then(
          () => undefined,
          (reason: unknown) => reason,
        );
      expect(error).to.be.instanceOf(AtomicMutationUnsupportedError);
    });
  }
  const failure = new TypeError("definitive validation failure");
  await WithResult(Promise.reject(failure), async () => {
    const error = await table
      .atomicMutation("record-a", request)
      .run()
      .then(
        () => undefined,
        (reason: unknown) => reason,
      );
    expect(error).to.equal(failure);
  });
}

type IsAssignable<From, To> = From extends To ? true : false;

async function ValidateTerminal() {
  for (const terminal of [
    { stage: "delete" },
    { options: {} },
    { args: ["record-a"] },
  ]) {
    const query = table.atomicMutation("record-a", request);
    Object.assign(query.build().at(-1)!, terminal);
    const error = await query.run().then(
      () => undefined,
      (reason: unknown) => reason,
    );
    expect(error).to.be.instanceOf(TypeError);
  }
}

function CheckConsumerTypes() {
  const rejectsNull: IsAssignable<
    null,
    AtomicUpdate<RecordData>["expectedRevision"]
  > = false;
  const rejectsArrayKey: IsAssignable<
    string[],
    Parameters<Table<RecordData>["atomicMutation"]>[0]
  > = false;
  const rejectsFunctionPatch: IsAssignable<
    () => RecordData,
    AtomicUpdate<RecordData>["patch"]
  > = false;
  const excludesSelection: IsAssignable<
    "atomicMutation",
    keyof ReturnType<typeof table.get>
  > = false;
  expect([
    rejectsNull,
    rejectsArrayKey,
    rejectsFunctionPatch,
    excludesSelection,
  ]).to.deep.equal([false, false, false, false]);
}
