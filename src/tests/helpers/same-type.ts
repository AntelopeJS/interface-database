/** Resolves to `true` when each of `A` and `B` is assignable to the other, else to `false`. */
export type Same<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
