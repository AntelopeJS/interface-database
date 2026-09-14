import { Query } from "./query";
import type { QueryStage } from "./common";

/** Matches an absent revision field on an existing record, not stored null. */
export interface MissingRevision {
  kind: "missing";
}

export interface AtomicCondition<T> {
  revisionField: keyof T & string;
  expectedRevision: string | MissingRevision;
}

/** Replaces supplied top-level fields and atomically installs a fresh revision. */
export interface AtomicUpdate<T> extends AtomicCondition<T> {
  type: "update";
  nextRevision: string;
  patch: Partial<T>;
}

export interface AtomicDelete<T> extends AtomicCondition<T> {
  type: "delete";
}

export type AtomicEqualityValue = string | number | boolean | Date;

/** Deletes by one observed scalar value; does not provide revision or ABA protection. */
export interface AtomicDeleteIfEqual<T> {
  type: "deleteIfEqual";
  field: keyof T & string;
  expectedValue: AtomicEqualityValue;
}

export type AtomicMutation<T> =
  | AtomicUpdate<T>
  | AtomicDelete<T>
  | AtomicDeleteIfEqual<T>;

export type AtomicMutationOutcome = "applied" | "not-applied" | "unknown";

const outcomes: readonly unknown[] = ["applied", "not-applied", "unknown"];
const tableStages = ["schema", "instance", "table"];
const identityFields = ["id", "_id"];

/** Signals an adapter that does not implement the atomic mutation contract. */
export class AtomicMutationUnsupportedError extends Error {
  public constructor() {
    super("The database adapter does not support atomicMutation");
    this.name = "AtomicMutationUnsupportedError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  );
}

function isToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function validateField(field: string) {
  if (!isToken(field) || field.includes(".") || field.startsWith("$")) {
    throw new TypeError("Atomic mutation fields must be literal field names");
  }
}

function validateConstant(value: unknown, ancestors = new Set<unknown>()) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (value instanceof Date && Number.isFinite(value.getTime())) return;
  if ((!Array.isArray(value) && !isRecord(value)) || ancestors.has(value)) {
    throw new TypeError("Atomic mutation patches must contain constant data");
  }
  if (Array.isArray(value) && Object.keys(value).length !== value.length) {
    throw new TypeError("Atomic mutation arrays must not contain holes");
  }
  ancestors.add(value);
  for (const [field, child] of Object.entries(value)) {
    validateField(field);
    validateConstant(child, ancestors);
  }
  ancestors.delete(value);
}

/** Validates literal input; adapters must additionally supply scope fields. */
export function ValidateAtomicMutation<T>(
  key: string,
  request: AtomicMutation<T>,
  protectedFields: readonly string[] = [],
): void {
  if (!isToken(key) || !isRecord(request)) {
    throw new TypeError("Atomic mutation requires one literal record identity");
  }
  const forbidden = [...identityFields, ...protectedFields];
  if (request.type === "deleteIfEqual") {
    validateEquality(request, forbidden);
    return;
  }
  validateField(request.revisionField);
  if (forbidden.includes(request.revisionField)) {
    throw new TypeError("Atomic mutation revision cannot be an identity field");
  }
  const expected = request.expectedRevision;
  const isMissing =
    isRecord(expected) &&
    expected.kind === "missing" &&
    Object.keys(expected).length === 1;
  if (!isToken(expected) && !isMissing) {
    throw new TypeError("Expected revision must be a token or missing tag");
  }
  if (request.type === "delete") return;
  if (request.type !== "update") {
    throw new TypeError("Unknown atomic mutation operation");
  }
  validateUpdate(request, forbidden);
}

function validateEquality<T>(
  request: AtomicDeleteIfEqual<T>,
  forbidden: string[],
) {
  validateField(request.field);
  if (forbidden.includes(request.field)) {
    throw new TypeError("Atomic equality field cannot be an identity field");
  }
  const value = request.expectedValue;
  if (
    !["string", "number", "boolean"].includes(typeof value) &&
    !(value instanceof Date)
  ) {
    throw new TypeError("Atomic equality requires a scalar or Date");
  }
  validateConstant(value);
}

function validateUpdate<T>(request: AtomicUpdate<T>, forbidden: string[]) {
  if (
    !isToken(request.nextRevision) ||
    request.nextRevision === request.expectedRevision
  ) {
    throw new TypeError("Atomic mutation requires a changed revision token");
  }
  if (!isRecord(request.patch)) {
    throw new TypeError("Atomic mutation patch must be an object");
  }
  forbidden.push(request.revisionField);
  if (Object.keys(request.patch).some((field) => forbidden.includes(field))) {
    throw new TypeError(
      "Atomic mutation patch cannot change identity or revision",
    );
  }
  validateConstant(request.patch);
}

/** Rejects selections and cross-instance operations before adapter dispatch. */
export function ValidateAtomicMutationTable(stages: QueryStage[]): void {
  if (
    stages.length !== tableStages.length ||
    stages.some((stage, index) => stage.stage !== tableStages[index]) ||
    (stages[1].options?.id !== undefined &&
      typeof stages[1].options.id !== "string")
  ) {
    throw new TypeError("Atomic mutation requires one instance-scoped table");
  }
}

/** Executes only the explicit atomic stage; invalid adapter results fail closed. */
export class AtomicMutationQuery extends Query<AtomicMutationOutcome> {
  public override async run(): Promise<AtomicMutationOutcome> {
    const terminal = this.stages.at(-1)!;
    ValidateAtomicMutationTable(this.stages.slice(0, -1));
    if (
      terminal.stage !== "atomicMutation" ||
      terminal.options !== undefined ||
      terminal.args.length !== 2
    ) {
      throw new TypeError(
        "Atomic mutation requires its canonical terminal stage",
      );
    }
    ValidateAtomicMutation(terminal.args[0], terminal.args[1]);
    const result = await super.run();
    if (!outcomes.includes(result)) throw new AtomicMutationUnsupportedError();
    return result;
  }

  public override cursor(): AsyncGenerator<
    AtomicMutationOutcome,
    void,
    unknown
  > {
    throw new TypeError("Atomic mutations cannot be executed as cursors");
  }
}
