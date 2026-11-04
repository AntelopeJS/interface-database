import { StagedObject } from "./common";
import { isKindHolder, MarkKind } from "./kind";

const QUERY_KIND = Symbol.for("@antelopejs/interface-database/Query@1");

// oxlint-disable-next-line typescript/no-unused-vars, typescript/no-unnecessary-type-parameters -- The executable entry consumes T through declaration merging (`interface Query<T> extends QueryExecution<T>` in src/query.ts); using T in the class needs a phantom member or merging the two entries.
export class Query<T> extends StagedObject {}

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
