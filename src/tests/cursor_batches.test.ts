import { expect } from "chai";
import { Schema } from "..";
import { CloseCursor, ReadCursor } from "../query";

const ROW_COUNT = 1000;
const BATCHES_REQ_ID = Number.MAX_SAFE_INTEGER;
const EMPTY_REQ_ID = Number.MAX_SAFE_INTEGER - 1;
const FEED_REQ_ID = Number.MAX_SAFE_INTEGER - 2;
const MAX_READS = ROW_COUNT / 10;
const RETURN_TIMEOUT_MS = 2000;
const FEED_TIMEOUT_MS = 5000;
const PROBE_INTERVAL_MS = 200;

type Row = { _id?: string; n: number };

const tableName = "rows";
const schema = new Schema<{ [tableName]: Row }>("test-cursor-batches", {
  [tableName]: { fields: { n: "number" }, indexes: { n: {} } },
});
const table = schema.instance("default").table(tableName);
const expected = Array.from({ length: ROW_COUNT }, (_, n) => n);

describe("Cursor batches", function () {
  this.timeout(FEED_TIMEOUT_MS + 2 * RETURN_TIMEOUT_MS);

  before(async () => {
    await schema.createInstance("default").run();
  });

  after(async () => {
    await table.delete().run();
    await schema.destroyInstance("default").run();
  });

  describe("ReadCursor over 1000 rows", () => {
    before(InsertRows);
    it(
      "Hands over every row once, in order, in few non-empty batches ending with an empty one",
      BatchesCoverTheSelection,
    );
    it(
      "Serves a cursor of an empty selection with an empty first batch",
      EmptySelection,
    );
    it(
      "Ends a half-read cursor at once on return(), unlike a consumer that keeps serving buffered rows",
      ReturnDropsBufferedRows,
    );
    it("Yields 1000 rows in order through for await", ForAwaitYieldsEveryRow);
  });

  describe("Change feed cursor", () => {
    it(
      "Resolves a next() blocked on a feed as done when return() is called",
      ReturnReleasesBlockedFeedRead,
    );
    it(
      "Settles a ReadCursor blocked on an open feed when CloseCursor is called",
      CloseSettlesBlockedFeedRead,
    );
  });
});

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
 * Reads a feed directly until one read stays pending on the open feed, inserting probe rows
 * (negative `n`) until the feed delivers, then closes it: the pending read must settle.
 */
async function CloseSettlesBlockedFeedRead() {
  const stages = table.changes().build();
  const deadline = Date.now() + FEED_TIMEOUT_MS;
  try {
    let read = ReadCursor(FEED_REQ_ID, stages);
    let opened = false;
    for (;;) {
      expect(
        Date.now(),
        `the feed did not open within ${FEED_TIMEOUT_MS} ms`,
      ).to.be.below(deadline);
      if (await SettlesWithin(read, PROBE_INTERVAL_MS)) {
        const events = await read;
        expect(
          events.length,
          "a feed read that settles before close hands over events",
        ).to.be.above(0);
        opened = true;
        read = ReadCursor(FEED_REQ_ID, stages);
      } else if (opened) {
        break;
      } else {
        await table.insert({ n: -1 }).run();
      }
    }
    await CloseCursor(FEED_REQ_ID);
    expect(
      await SettlesWithin(read, RETURN_TIMEOUT_MS),
      "a driver whose CloseCursor leaves a read in flight pending",
    ).to.equal(true);
  } finally {
    await CloseCursor(FEED_REQ_ID);
    await table
      .filter((row) => row.key("n").lt(0))
      .delete()
      .run();
  }
}

function ExpectRowsInOrder(rows: readonly unknown[], why: string) {
  expect(rows, why).to.have.lengthOf(ROW_COUNT);
  rows.forEach((row, n) => {
    expect(row, why).to.have.property("n", n);
  });
}

async function InsertRows() {
  await table.delete().run();
  await table.insert(expected.map((n) => ({ n }))).run();
}

async function BatchesCoverTheSelection() {
  const stages = table.orderBy("n").build();
  const batches: unknown[][] = [];
  try {
    for (;;) {
      const batch = await ReadCursor(BATCHES_REQ_ID, stages);
      expect(
        batch,
        "a driver that still hands over one IteratorResult",
      ).to.be.an("array");
      batches.push(batch);
      if (batch.length === 0) {
        break;
      }
      expect(
        batches.length,
        "a driver that never ends the cursor keeps handing over batches",
      ).to.be.at.most(ROW_COUNT + 1);
    }
  } finally {
    await CloseCursor(BATCHES_REQ_ID);
  }

  ExpectRowsInOrder(
    batches.flat(),
    "a driver that drops, repeats or reorders rows across batches, or hands over [] before the end",
  );
  expect(batches.at(-1), "the last batch is the empty one").to.deep.equal([]);
  expect(
    batches.length - 1,
    "a driver that hands over one row per read",
  ).to.be.at.most(MAX_READS);
}

async function EmptySelection() {
  const stages = table.filter((row) => row.key("n").lt(0)).build();
  try {
    expect(
      await ReadCursor(EMPTY_REQ_ID, stages),
      "a driver that waits for a row or ends an empty cursor with a non-empty batch",
    ).to.deep.equal([]);
  } finally {
    await CloseCursor(EMPTY_REQ_ID);
  }
}

async function ReturnDropsBufferedRows() {
  const cursor = table.orderBy("n").cursor();
  const first = await cursor.next();
  expect(first.done, "the cursor has rows").to.equal(false);
  await cursor.return();
  expect(
    await cursor.next(),
    "a consumer that keeps serving buffered rows after return()",
  ).to.deep.equal({ done: true, value: undefined });
}

async function ForAwaitYieldsEveryRow() {
  const seen: unknown[] = [];
  for await (const row of table.orderBy("n")) {
    seen.push(row);
  }
  ExpectRowsInOrder(
    seen,
    "a consumer that skips or repeats the rows between two batches",
  );
}

async function ReturnReleasesBlockedFeedRead() {
  const feed = table.changes().cursor();
  const blocked = feed.next();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(resolve, RETURN_TIMEOUT_MS, "timeout");
  });
  try {
    await feed.return();
    expect(
      await Promise.race([blocked, timeout]),
      "a consumer whose return() leaves a blocked feed read hanging",
    ).to.deep.equal({ done: true, value: undefined });
  } finally {
    clearTimeout(timer);
  }
}
