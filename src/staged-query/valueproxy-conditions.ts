import type { QueryValue } from "./common";
import type { ValueProxy } from "./valueproxy";

/** A proxy of `T`, or a plain `T`. */
export type ValueProxyOrValue<T> = ValueProxy<T> | T;

export type Is<Left, Right, R> = Left extends Right ? R : never;

export type ArrayValue<T> = T extends (infer V)[] ? V : never;

export type IsArray<Left, Right, R> = Right extends (infer A)[]
  ? Is<A, Left, R>
  : never;

export type OnlyObject<T> = T extends object ? T : never;

type NullableOperand<V> = V | ValueProxy<V> | ValueProxy<V | null> | null;

/**
 * The operand `add` takes for a receiver: seconds for a date, a number for a
 * number, a string for a string, a list for a list. A `null` operand answers
 * null.
 */
export type AddOperand<T> = T extends Date | number
  ? NullableOperand<number>
  : T extends string
    ? NullableOperand<string>
    : T extends (infer V)[]
      ? NullableOperand<(V & QueryValue)[]>
      : never;

/**
 * An operand of the same type as a value proxy of `T`: a proxy of `T`, or a
 * plain `T` that a stage can record, as {@link QueryValue} describes it. A type
 * no stage records, such as `bigint` or a function, leaves only the proxy.
 */
export type QueryOperand<T> = ValueProxy<T> | (T & QueryValue);
