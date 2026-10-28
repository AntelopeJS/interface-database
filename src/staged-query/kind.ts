import type { StagedObject } from "./common";

type KindOwner = StagedObject | Error;

type KindHolder = Partial<Record<symbol, boolean>>;

export function MarkKind(target: KindOwner, kind: symbol): void {
  Object.defineProperty(target, kind, { value: true });
}

export function HasKind<Value>(value: Value, kind: symbol): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as KindHolder)[kind] === true
  );
}
