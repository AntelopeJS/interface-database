export type Is<Left, Right, R> = Left extends Right ? R : never;

export type ArrayValue<T> = T extends (infer V)[] ? V : never;

export type IsArray<Left, Right, R> = Right extends (infer A)[]
  ? Is<A, Left, R>
  : never;

export type OnlyObject<T> = T extends object ? T : never;
