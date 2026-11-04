import type { StagedObject } from "./common";

type KindOwner = StagedObject | Error;

type KindHolder = Partial<Record<symbol, boolean>>;

export function isKindHolder(value: unknown): value is KindHolder {
  return typeof value === "object" && value !== null;
}

export function MarkKind(target: KindOwner, kind: symbol): void {
  Object.defineProperty(target, kind, { value: true });
}
