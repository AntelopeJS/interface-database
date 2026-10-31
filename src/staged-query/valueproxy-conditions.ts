import type { ValueProxy } from "./valueproxy";

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
      ? NullableOperand<V[]>
      : never;
