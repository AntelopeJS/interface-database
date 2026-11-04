import { expect } from "chai";

/** Awaits a promise that must reject with an instance of `kind` and returns that rejection. */
export async function rejectionOf<E extends Error>(
  promise: PromiseLike<unknown>,
  kind: new (...args: never[]) => E,
): Promise<E> {
  const [settled] = await Promise.allSettled([promise]);
  if (settled.status === "fulfilled") {
    expect.fail(`expected a rejection with ${kind.name}`);
  }
  if (settled.reason instanceof kind) {
    return settled.reason;
  }
  return expect.fail(`expected a rejection with ${kind.name}`);
}
