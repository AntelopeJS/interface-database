import { expect } from "chai";
import { type Query, Schema } from "..";

import { Vehicle, vehicles } from "./datasets/vehicles";

const tableName = "test-table";
const schema = new Schema<{ [tableName]: Vehicle }>("test-change-feeds", {
  [tableName]: Vehicle,
});
const table = schema.instance("default").table(tableName);
type VehicleTable = typeof table;

const instancesSchema = new Schema<{ [tableName]: Vehicle }>(
  "test-change-feeds-instances",
  { [tableName]: Vehicle },
);
const defaults = instancesSchema.instance().table(tableName);
const named = instancesSchema.instance("named").table(tableName);

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

describe("Change Streams on the default instance", function () {
  this.timeout(2 * FEED_TIMEOUT_MS);

  before(async () => {
    await instancesSchema.createInstance().run();
    await instancesSchema.createInstance("named").run();
  });

  it(
    "Delivers an insert, an update and a delete on instance(), in order",
    DefaultInstanceEventsTest,
  );
  it(
    "Keeps the writes of a named instance out of the feed of instance()",
    DefaultFeedIsolationTest,
  );
  it(
    "Keeps the writes of instance() out of the feed of a named instance",
    NamedFeedIsolationTest,
  );
  after(async () => {
    await defaults.delete().run();
    await named.delete().run();
    await instancesSchema.destroyInstance("named").run();
    await instancesSchema.destroyInstance().run();
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
  changeType?: string;
  newValue?: Vehicle;
  oldValue?: Vehicle;
}

function IdOf(change: VehicleChange) {
  return change.newValue?._id ?? change.oldValue?._id;
}

/** The row one probe wrote, and how to recognise the event of that one write. */
interface ProbeWrite {
  id: string;
  isEcho: (change: VehicleChange) => boolean;
}

/** Writes one probe row on a table and answers which event it causes. */
type Prober = () => Promise<ProbeWrite>;

/** Probes by inserting a new row each time. */
function InsertProbe(target: VehicleTable): Prober {
  return async () => {
    const [id] = await target.insert({ ...probe }).run();
    return { id, isEcho: (change) => IdOf(change) === id };
  };
}

/**
 * Probes by updating one row inserted before the feed opens, a fresh value per write, so a feed
 * that drops inserts still opens and the test names the missing insert.
 */
async function UpdateProbe(target: VehicleTable): Promise<Prober> {
  const [id] = await target.insert({ ...probe }).run();
  let kilometers = probe.kilometers;
  return async () => {
    kilometers += 1;
    const written = kilometers;
    await target.get(id).update({ kilometers: written }).run();
    return {
      id,
      isEcho: (change) =>
        IdOf(change) === id && change.newValue?.kilometers === written,
    };
  };
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
 * Reads a change feed of `target` under one deadline, and tells the probe rows it writes apart
 * from the rows a test writes. The contract gives no signal that a feed is open, so a probe is
 * written until the feed delivers one.
 */
class FeedReader<T extends VehicleChange> {
  private readonly deadline = Date.now() + FEED_TIMEOUT_MS;
  private readonly probes = new Set<string>();
  private pending: Promise<IteratorResult<T, void>>;

  public constructor(
    private readonly feed: AsyncGenerator<T, void, unknown>,
    private readonly target: VehicleTable,
    private readonly probe: Prober,
  ) {
    this.pending = Handled(feed.next());
  }

  /** Resolves once the feed is known open, with nothing left to deliver. */
  public async open() {
    while (!(await SettlesWithin(this.pending, PROBE_INTERVAL_MS))) {
      if (Date.now() > this.deadline) {
        expect.fail(`the feed did not open within ${FEED_TIMEOUT_MS} ms`);
      }
      await this.writeProbe();
    }
    await this.next("the feed to open");
    const marker = await this.writeProbe();
    await this.readUntil(marker.isEcho, "the probe that drains the feed");
  }

  /**
   * Runs `actor`, reads until `expected` events of rows other than probes arrive, then reads
   * through a closing probe, and answers every such event read on the way. With `expected` 0 it
   * reads straight to the closing probe, so the answer holds every event that should not exist.
   */
  public async read(actor: () => Promise<void>, expected: number) {
    await actor();
    const written =
      expected > 0
        ? await this.readUntil(
            (_, others) => others.length >= expected,
            `${expected} change events`,
          )
        : [];
    const marker = await this.writeProbe();
    const late = await this.readUntil(marker.isEcho, "the closing probe");
    return [...written, ...late];
  }

  /** Closes the feed and deletes the probe rows. */
  public async close() {
    await this.feed.return();
    if (this.probes.size > 0) {
      await this.target
        .getAll([...this.probes])
        .delete()
        .run();
    }
  }

  private async writeProbe() {
    const written = await this.probe();
    this.probes.add(written.id);
    return written;
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
      const received = others.map((change) => change.changeType).join(", ");
      const change = await this.next(
        `${waitingFor} (received: ${received || "none"})`,
      );
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

/** Opens a feed of `stream` on `target`, runs `actor` once it is open, and answers its events. */
async function ReadFeed<T extends VehicleChange>(
  stream: Query<T[]>,
  target: VehicleTable,
  prober: Prober,
  actor: () => Promise<void>,
  expected: number,
) {
  const reader = new FeedReader(stream.cursor(), target, prober);
  try {
    await reader.open();
    return await reader.read(actor, expected);
  } finally {
    await reader.close();
  }
}

function ReadChanges<T extends VehicleChange>(
  stream: Query<T[]>,
  actor: () => Promise<void>,
  expected: number,
) {
  return ReadFeed(stream, table, InsertProbe(table), actor, expected);
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

function Citroen(price: number): Vehicle {
  return {
    car: "Citroen",
    manufactured: new Date("2010-05-05"),
    price,
    isElectric: false,
    kilometers: 42000,
  };
}

async function DefaultInstanceEventsTest() {
  let written = "";
  const results = await ReadFeed(
    defaults.changes(),
    defaults,
    await UpdateProbe(defaults),
    async () => {
      [written] = await defaults.insert(Citroen(9000)).run();
      await defaults.get(written).update({ price: 8000 }).run();
      await defaults.get(written).delete().run();
    },
    3,
  );

  expect(
    results.map((change) => change.changeType),
    "a driver whose feed on instance() drops or reorders an insert, an update or a delete",
  ).to.deep.equal(["added", "modified", "removed"]);
  expect(
    results.map(IdOf),
    "a driver whose feed on instance() reports another row",
  ).to.deep.equal([written, written, written]);
}

/** Inserts, updates and deletes rows of `target`, one seeded before any feed opens. */
async function WriteEachKind(target: VehicleTable) {
  const [seeded] = await target.insert(Citroen(1000)).run();
  return async () => {
    await target.insert(Citroen(2000)).run();
    await target.get(seeded).update({ price: 3000 }).run();
    await target.get(seeded).delete().run();
  };
}

async function DefaultFeedIsolationTest() {
  const results = await ReadFeed(
    defaults.changes(),
    defaults,
    await UpdateProbe(defaults),
    await WriteEachKind(named),
    0,
  );

  expect(
    results,
    "a driver whose feed on instance() delivers the writes of a named instance",
  ).to.deep.equal([]);
}

async function NamedFeedIsolationTest() {
  const results = await ReadFeed(
    named.changes(),
    named,
    await UpdateProbe(named),
    await WriteEachKind(defaults),
    0,
  );

  expect(
    results,
    "a driver whose feed on a named instance delivers the writes of instance()",
  ).to.deep.equal([]);
}
