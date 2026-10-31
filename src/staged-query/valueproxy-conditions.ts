export type Is<Left, Right, R> = Left extends Right ? R : never;

export type ArrayValue<T> = T extends (infer V)[] ? V : never;

export type IsArray<Left, Right, R> = Right extends (infer A)[]
  ? Is<A, Left, R>
  : never;

export type OnlyObject<T> = T extends object ? T : never;

/**
 * The operand `add` takes for a receiver: seconds for a date, a number for a
 * number, a string for a string, a list for a list. A `null` operand answers
 * null.
 */
export type AddOperand<T> =
  | null
  | (T extends Date | number
      ? number
      : T extends string
        ? string
        : T extends (infer V)[]
          ? V[]
          : never);
