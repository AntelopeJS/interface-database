import { expect } from "chai";
import { type Query, Schema } from "..";

import { Vehicle, vehicles } from "./datasets/vehicles";

const tableName = "test-table";
const schema = new Schema<{ [tableName]: Vehicle }>("test-change-feeds", {
  [tableName]: Vehicle,
});
const table = schema.instance("default").table(tableName);

const FEED_TIMEOUT_MS = 5000;
const PROBE_INTERVAL_MS = 200;

describe("Change Streams", function () {
  this.timeout(2 * FEED_TIMEOUT_MS);

  before(async () => {
    await schema.createInstance("default").run();
  });

  it("Insert Test Data", InsertTest);
  it("Insert Event", InsertEventTest);
  it("Update Event", UpdateEventTest);
  it("Delete Event", DeleteEventTest);
  it("Bulk Insert Events", BulkInsertEventTest);
  after(async () => {
    await table.delete().run();
    await schema.destroyInstance("default").run();
  });
});

async function InsertTest() {
  const response = await table.insert(vehicles).run();
  expect(response).to.be.an("array");

  expect(response).to.have.lengthOf(vehicles.length);
  response.forEach((val) => {
    expect(val).to.be.a("string");
  });
}

const probe: Vehicle = {
  car: "Renault",
  manufactured: new Date("1999-09-09"),
  price: 1,
  isElectric: false,
  kilometers: 1,
};

interface VehicleChange {
  newValue?: Vehicle;
  oldValue?: Vehicle;
}

function IdOf(change: VehicleChange) {
  return change.newValue?._id ?? change.oldValue?._id;
}

function SettlesWithin(pending: Promise<unknown>, ms: number) {
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    const settle = () => {
      clearTimeout(timer);
      resolve(true);
    };
    pending.then(settle, settle);
  });
}

/**
 * Answers `pending` with a handler attached, so a rejection while no read awaits it still reaches
 * the next read instead of being reported as unhandled.
 */
function Handled<T>(pending: Promise<T>) {
  pending.catch(() => undefined);
  return pending;
}

/**
 * Reads a change feed of {@link table} under one deadline, and tells the probe rows it writes
 * apart from the rows a test writes. The contract gives no signal that a feed is open, so a probe
 * row is inserted until the feed delivers one.
 */
class FeedReader<T extends VehicleChange> {
  private readonly deadline = Date.now() + FEED_TIMEOUT_MS;
  private readonly probes = new Set<string>();
  private pending: Promise<IteratorResult<T, void>>;

  public constructor(private readonly feed: AsyncGenerator<T, void, unknown>) {
    this.pending = Handled(feed.next());
  }

  /** Resolves once the feed is known open, with nothing left to deliver. */
  public async open() {
    while (!(await SettlesWithin(this.pending, PROBE_INTERVAL_MS))) {
      if (Date.now() > this.deadline) {
        expect.fail(`the feed did not open within ${FEED_TIMEOUT_MS} ms`);
      }
      await this.insertProbe();
    }
    await this.next("the feed to open");
    const marker = await this.insertProbe();
    await this.readUntil(
      (change) => IdOf(change) === marker,
      "the probe that drains the feed",
    );
  }

  /**
   * Runs `actor`, reads until `expected` events of rows other than probes arrive, then reads
   * through a closing probe, and answers every such event read on the way.
   */
  public async read(actor: () => Promise<void>, expected: number) {
    await actor();
    const written = await this.readUntil(
      (_, others) => others.length >= expected,
      `${expected} change events`,
    );
    const marker = await this.insertProbe();
    const late = await this.readUntil(
      (change) => IdOf(change) === marker,
      "the closing probe",
    );
    return [...written, ...late];
  }

  /** Closes the feed and deletes the probe rows. */
  public async close() {
    await this.feed.return();
    if (this.probes.size > 0) {
      await table
        .getAll([...this.probes])
        .delete()
        .run();
    }
  }

  private async insertProbe() {
    const [id] = await table.insert({ ...probe }).run();
    this.probes.add(id);
    return id;
  }

  private async next(waitingFor: string): Promise<T> {
    const remaining = this.deadline - Date.now();
    if (!(await SettlesWithin(this.pending, Math.max(remaining, 0)))) {
      expect.fail(
        `no change event within ${FEED_TIMEOUT_MS} ms while waiting for ${waitingFor}`,
      );
    }
    const step = await this.pending;
    if (step.done) {
      expect.fail(`the feed ended while waiting for ${waitingFor}`);
    }
    this.pending = Handled(this.feed.next());
    return step.value;
  }

  private async readUntil(
    stop: (change: T, others: readonly T[]) => boolean,
    waitingFor: string,
  ) {
    const others: T[] = [];
    for (;;) {
      const change = await this.next(waitingFor);
      const id = IdOf(change);
      if (id === undefined || !this.probes.has(id)) {
        others.push(change);
      }
      if (stop(change, others)) {
        return others;
      }
    }
  }
}

async function ReadChanges<T extends VehicleChange>(
  stream: Query<T[]>,
  actor: () => Promise<void>,
  expected: number,
) {
  const reader = new FeedReader(stream.cursor());
  try {
    await reader.open();
    return await reader.read(actor, expected);
  } finally {
    await reader.close();
  }
}

let inserted: string[];
async function InsertEventTest() {
  const newDocument: Vehicle = {
    car: "Renault",
    manufactured: new Date("2000-01-12"),
    price: 12000,
    isElectric: false,
    kilometers: 98812,
  };

  const results = await ReadChanges(
    table.changes(),
    async () => {
      inserted = await table.insert(newDocument).run();
    },
    1,
  );

  expect(results).to.be.an("array").of.length(1);
  expect(results[0]).to.have.property("changeType", "added");
  expect(results[0])
    .to.have.property("newValue")
    .that.deep.include(newDocument);
}

async function UpdateEventTest() {
  const results = await ReadChanges(
    table.filter((doc) => doc.key("car").eq("Renault")).changes(),
    async () => {
      await table
        .filter((doc) => doc.key("car").eq("Renault"))
        .update({ price: 0 })
        .run();
    },
    2,
  );

  expect(results).to.be.an("array").of.length(2);
  for (const entry of results) {
    expect(entry).to.have.property("changeType", "modified");
    expect(entry).to.have.property("newValue").that.has.property("price", 0);
  }
}

async function DeleteEventTest() {
  const results = await ReadChanges(
    table.changes(),
    async () => {
      await table.get(inserted[0]).delete().run();
    },
    1,
  );

  expect(results).to.be.an("array").of.length(1);
  expect(results[0]).to.have.property("changeType", "removed");
  expect(results[0])
    .to.have.property("oldValue")
    .that.has.property("_id", inserted[0]);
}

async function BulkInsertEventTest() {
  const newDocs: Vehicle[] = [
    {
      car: "Tesla",
      manufactured: new Date("2023-06-15"),
      price: 45000,
      isElectric: true,
      kilometers: 5000,
    },
    {
      car: "BMW",
      manufactured: new Date("2021-03-20"),
      price: 55000,
      isElectric: false,
      kilometers: 30000,
    },
  ];

  const results = await ReadChanges(
    table.changes(),
    async () => {
      await table.insert(newDocs).run();
    },
    newDocs.length,
  );

  expect(results).to.be.an("array").of.length(newDocs.length);
  results.forEach((entry) => {
    expect(entry).to.have.property("changeType", "added");
    expect(entry).to.have.property("newValue");
  });

  const insertedCars = results
    .flatMap((entry) => (entry.newValue ? [entry.newValue.car] : []))
    .sort((a, b) => Number(a > b) - Number(a < b));
  expect(insertedCars).to.deep.equal(["BMW", "Tesla"]);
}
