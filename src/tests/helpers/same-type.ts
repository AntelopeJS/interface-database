/** Resolves to `true` when each of `A` and `B` is assignable to the other, else to `false`. */
export type Same<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

/** Resolves to `true` when `A` is `any`, else to `false`. `Same` cannot tell, as `any` is assignable both ways. */
type IsAny<A> = 0 extends 1 & A ? true : false;

/** Like `Same`, but `any` on either side resolves to `false`. */
export type Exact<A, B> =
  IsAny<A> extends true ? false : IsAny<B> extends true ? false : Same<A, B>;
