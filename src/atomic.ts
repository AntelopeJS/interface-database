import { Query } from "./query";
import {
  AtomicMutationQuery as StagedAtomicMutationQuery,
  ValidateAtomicMutation,
  ValidateAtomicMutationTable,
  type AtomicMutationOutcome,
} from "./staged-query/atomic";

const outcomes: readonly unknown[] = ["applied", "not-applied", "unknown"];

/** Signals an adapter that does not implement the atomic mutation contract. */
export class AtomicMutationUnsupportedError extends Error {
  public constructor() {
    super("The database adapter does not support atomicMutation");
    this.name = "AtomicMutationUnsupportedError";
  }
}

async function run(
  this: StagedAtomicMutationQuery,
): Promise<AtomicMutationOutcome> {
  const stages = this.build();
  const terminal = stages.at(-1)!;
  ValidateAtomicMutationTable(stages.slice(0, -1));
  if (
    terminal.stage !== "atomicMutation" ||
    terminal.options !== undefined ||
    terminal.args.length !== 2
  ) {
    throw new TypeError(
      "Atomic mutation requires its canonical terminal stage",
    );
  }
  ValidateAtomicMutation(terminal.args[0], terminal.args[1]);
  const result = await Query.prototype.run.call(this);
  if (!outcomes.includes(result)) throw new AtomicMutationUnsupportedError();
  return result;
}

function cursor(): AsyncGenerator<AtomicMutationOutcome, void, unknown> {
  throw new TypeError("Atomic mutations cannot be executed as cursors");
}

Object.defineProperties(StagedAtomicMutationQuery.prototype, {
  run: { configurable: true, value: run, writable: true },
  cursor: { configurable: true, value: cursor, writable: true },
});

export * from "./staged-query/atomic";
export { StagedAtomicMutationQuery as AtomicMutationQuery };
