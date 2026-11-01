import { StagedObject, type QueryValue } from "./common";
import { IsQuery } from "./query";
import { IsValueProxy } from "./valueproxy-kind";

type Scalar = string | number | boolean | null | undefined | Date;

function isScalar(value: unknown): value is Scalar {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  );
}

function isStaged(value: unknown): value is StagedObject {
  return value instanceof StagedObject || IsQuery(value) || IsValueProxy(value);
}

interface Visit {
  node: unknown;
  leaving?: object;
}

/**
 * Whether a value is a {@link QueryValue} all the way down: a staged object,
 * a scalar, a date, or a list or plain record of such values. A `bigint`, a
 * `symbol`, a function, a `Map`, a class instance and a cyclic structure are
 * not, since no provider records them as given. A value held twice is.
 *
 * Use it where a value arrives typed `unknown` and becomes the operand of a
 * stage. It walks with a stack of its own, so a deeply nested value cannot
 * exhaust the call stack.
 *
 * @param value Value to test
 * @returns True if the value is a query value
 */
export function IsQueryValue(value: unknown): value is QueryValue {
  const ancestors = new Set<object>();
  const pending: Visit[] = [{ node: value }];
  for (let visit = pending.pop(); visit; visit = pending.pop()) {
    if (visit.leaving) {
      ancestors.delete(visit.leaving);
      continue;
    }
    const { node } = visit;
    if (isScalar(node) || isStaged(node)) {
      continue;
    }
    if (typeof node !== "object" || ancestors.has(node)) {
      return false;
    }
    const prototype: unknown = Object.getPrototypeOf(node);
    if (
      !Array.isArray(node) &&
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      return false;
    }
    ancestors.add(node);
    pending.push({ node: undefined, leaving: node });
    for (const member of Object.values(node)) {
      pending.push({ node: member });
    }
  }
  return true;
}
