import { InterfaceFunction } from "@antelopejs/interface-core";

import { StagedObject } from "./staged-query/common";
import { Query as StagedQuery } from "./staged-query/query";

//@internal
export const RunQuery =
  InterfaceFunction<(query: StagedObject["stages"]) => any>();
//@internal
export const ReadCursor =
  InterfaceFunction<
    (reqId: number, stages: StagedObject["stages"]) => IteratorResult<any, void>
  >();
//@internal
export const CloseCursor = InterfaceFunction<(reqId: number) => void>();

let nextReqId = 0;
class IterableCursor implements AsyncGenerator<any, void, unknown> {
  private reqId: number;
  private resolve?: (val: IteratorResult<any, void>) => void;
  private reject?: (err: any) => void;

  public constructor(private stages: StagedObject["stages"]) {
    this.reqId = nextReqId++;
  }

  public next(): Promise<IteratorResult<any, void>> {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      void ReadCursor(this.reqId, this.stages)
        .then(resolve, reject)
        .finally(() => {
          this.resolve = undefined;
          this.reject = undefined;
        });
    });
  }

  public async return(): Promise<IteratorResult<any, void>> {
    const res = { done: true, value: undefined };
    if (this.resolve) {
      this.resolve(res);
      this.resolve = undefined;
      this.reject = undefined;
    }
    await CloseCursor(this.reqId);
    return res;
  }

  public async throw(e: any): Promise<IteratorResult<any, void>> {
    if (this.reject) {
      this.reject(e);
      this.resolve = undefined;
      this.reject = undefined;
    }
    await CloseCursor(this.reqId);
    return { done: true, value: undefined };
  }

  [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown> {
    return this;
  }
}

export interface QueryExecution<T> extends PromiseLike<T> {
  run(): Promise<T>;
  cursor(): AsyncGenerator<T extends Array<infer U> ? U : T, void, unknown>;
  [Symbol.asyncIterator](): AsyncGenerator<
    T extends Array<infer U> ? U : T,
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

function then<T, TResult1 = T, TResult2 = never>(
  this: StagedQuery<T>,
  onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
  onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
): PromiseLike<TResult1 | TResult2> {
  return this.run().then(onfulfilled, onrejected);
}

function cursor<T>(
  this: StagedQuery<T>,
): AsyncGenerator<T extends Array<infer U> ? U : T, void, unknown> {
  return new IterableCursor(this.build());
}

function iterate<T>(
  this: StagedQuery<T>,
): AsyncGenerator<T extends Array<infer U> ? U : T, void, unknown> {
  return this.cursor();
}

Object.defineProperties(StagedQuery.prototype, {
  run: { configurable: true, value: run, writable: true },
  // oxlint-disable-next-line unicorn/no-thenable -- Query is deliberately PromiseLike so `await query` executes it.
  then: { configurable: true, value: then, writable: true },
  cursor: { configurable: true, value: cursor, writable: true },
  [Symbol.asyncIterator]: {
    configurable: true,
    value: iterate,
    writable: true,
  },
});

export { StagedQuery as Query };
