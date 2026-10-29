import type { StagedObject } from "./common";

type KindOwner = StagedObject | Error;

type KindHolder = Partial<Record<symbol, boolean>>;

function isKindHolder<Value>(value: Value): value is Value & KindHolder {
  return typeof value === "object" && value !== null;
}

export function MarkKind(target: KindOwner, kind: symbol): void {
  Object.defineProperty(target, kind, { value: true });
}

export function HasKind<Value>(value: Value, kind: symbol): boolean {
  return isKindHolder(value) && value[kind] === true;
}
