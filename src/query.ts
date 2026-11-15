import { InterfaceFunction } from "@antelopejs/interface-core";

import { StagedObject } from "./staged-query/common";
import { Query as StagedQuery, type QueryYield } from "./staged-query/query";

/** @internal */
export const RunQuery =
  InterfaceFunction<(query: StagedObject["stages"]) => any>();
/**
 * Reads a cursor of staged `stages`, identified by `reqId`. Drivers implement it.
 *
 * The first read of `reqId` opens the cursor with `stages`. Later reads continue it.
 *
 * A read resolves with the next batch: at least one row, in query order, and every row the driver
 * already holds or gets in one native fetch. It never waits for more rows once it has one, so a
 * change feed hands over each event as soon as it arrives.
 *
 * An empty array means the cursor is exhausted. The driver has released it, and the consumer never
 * reads `reqId` again.
 *
 * A rejected read has released the cursor. The consumer never reads `reqId` again.
 * @internal
 */
export const ReadCursor =
  InterfaceFunction<
    (reqId: number, stages: StagedObject["stages"]) => unknown[]
  >();
/**
 * Releases the cursor `reqId` and resolves a read in flight. It is a no-op for a cursor already
 * released or never opened.
 * @internal
 */
export const CloseCursor = InterfaceFunction<(reqId: number) => void>();

let nextReqId = 0;

function closeSignal() {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.catch(() => undefined);
  return { promise, resolve, reject };
}

class IterableCursor implements AsyncGenerator<any, void, unknown> {
  private readonly reqId = nextReqId++;
  private rows: Iterator<unknown> = [].values();
  private ended = false;
  private read?: Promise<void>;
  private readonly closing = closeSignal();

  public constructor(private readonly stages: StagedObject["stages"]) {}

  public async next(): Promise<IteratorResult<any, void>> {
    for (;;) {
      const row = this.rows.next();
      if (!row.done) {
        return { done: false, value: row.value };
      }
      if (this.ended) {
        return { done: true, value: undefined };
      }
      this.read ??= this.readBatch();
      await Promise.race([this.read, this.closing.promise]);
    }
  }

  public async return(): Promise<IteratorResult<any, void>> {
    this.release();
    this.closing.resolve();
    await CloseCursor(this.reqId);
    return { done: true, value: undefined };
  }

  public async throw(e: unknown): Promise<IteratorResult<any, void>> {
    this.release();
    this.closing.reject(e);
    await CloseCursor(this.reqId);
    return { done: true, value: undefined };
  }

  [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown> {
    return this;
  }

  private release() {
    this.ended = true;
    this.rows = [].values();
  }

  private async readBatch() {
    try {
      const batch = await ReadCursor(this.reqId, this.stages);
      if (this.ended) {
        return;
      }
      if (batch.length === 0) {
        this.ended = true;
      } else {
        this.rows = batch.values();
      }
    } catch (error) {
      const released = this.ended;
      this.ended = true;
      if (!released) {
        throw error;
      }
    } finally {
      this.read = undefined;
    }
  }
}

export interface QueryExecution<T> {
  run(): Promise<T>;
  cursor(): AsyncGenerator<QueryYield<T>["item"], void, unknown>;
  [Symbol.asyncIterator](): AsyncGenerator<
    QueryYield<T>["item"],
    void,
    unknown
  >;
}

declare module "./staged-query/query" {
  interface Query<T> extends QueryExecution<T> {}
}

function run<T>(this: StagedQuery<T>): Promise<T> {
  return RunQuery(this.build());
}

function cursor<T>(
  this: StagedQuery<T>,
): AsyncGenerator<QueryYield<T>["item"], void, unknown> {
  return new IterableCursor(this.build());
}

function iterate<T>(
  this: StagedQuery<T>,
): AsyncGenerator<QueryYield<T>["item"], void, unknown> {
  return this.cursor();
}

Object.defineProperties(StagedQuery.prototype, {
  run: { configurable: true, value: run, writable: true },
  cursor: { configurable: true, value: cursor, writable: true },
  [Symbol.asyncIterator]: {
    configurable: true,
    value: iterate,
    writable: true,
  },
});

export { StagedQuery as Query };
export { IsQuery } from "./staged-query/query";
