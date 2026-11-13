import { StagedObject } from "./common";
import { isKindHolder, MarkKind } from "./kind";

const QUERY_KIND = Symbol.for("@antelopejs/interface-database/Query@1");

/**
 * What running a query whose result is `T` yields: `result` is what `run()`
 * resolves to, and `item` is what its cursor reads at a time, each element of
 * a list result, else the whole result.
 */
export interface QueryYield<T> {
  result: T;
  item: T extends Array<infer U> ? U : T;
}

/**
 * A query whose result is `T`. This entry point records its stages; the
 * runtime entry point runs them.
 */
export class Query<T> extends StagedObject {
  /**
   * What the query yields when it runs. A query holds stages, never a result,
   * so no instance has this property: it is declared for the type checker,
   * which tells a `Query<string>` from a `Query<number>` by it and reads `T`
   * back from any query type.
   */
  declare protected readonly yields?: QueryYield<T>;
}

MarkKind(Query.prototype, QUERY_KIND);

/**
 * Whether a value is a query, built by any instance of this interface.
 *
 * Unlike `instanceof`, it also recognises objects built by the instance of
 * another provider binding.
 *
 * @param value Value to test
 * @returns True if the value is a query
 */
export function IsQuery(value: unknown): value is Query<unknown> {
  return isKindHolder(value) && value[QUERY_KIND] === true;
}
