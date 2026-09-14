import { InterfaceFunction } from "@antelopejs/interface-core";

type TransactionRunner = <T>(callback: () => Promise<T>) => Promise<T>;

/**
 * Runs a callback once inside an atomic database transaction.
 *
 * The callback is invoked exactly once. Database operations started through the
 * interface during the callback share the transaction. The returned promise
 * resolves only after commit, while callback rejections abort the transaction.
 *
 * Do not perform externally visible side effects in the callback because a
 * database rollback cannot undo them. Nested transactions and database work
 * started in the callback but awaited after it returns are rejected. Providers
 * reject this operation when their configured topology does not support
 * transactions.
 *
 * A rejection while committing can have an ambiguous outcome: the provider may
 * be unable to determine whether the database committed the transaction. The
 * callback is never replayed to resolve uncertain commit acknowledgement.
 *
 * Transaction duration and commit acknowledgement bounds are provider-specific.
 *
 * @param callback Asynchronous database work to execute atomically
 * @returns The callback result after the transaction is committed
 */
export const RunInTransaction =
  InterfaceFunction<TransactionRunner>() as TransactionRunner;
