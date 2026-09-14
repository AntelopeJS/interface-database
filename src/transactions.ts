import { InterfaceFunction } from "@antelopejs/interface-core";

/**
 * Runs a callback once inside an atomic database transaction.
 *
 * The returned promise resolves after commit. Rejections abort the transaction.
 */
export const RunInTransaction =
  InterfaceFunction<<T>(callback: () => Promise<T>) => Promise<T>>();
