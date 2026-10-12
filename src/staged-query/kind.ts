type KindHolder = Record<symbol, unknown>;

export function MarkKind(target: object, kind: symbol): void {
  Object.defineProperty(target, kind, { value: true });
}

export function HasKind(value: unknown, kind: symbol): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as KindHolder)[kind] === true
  );
}
