import type { Datum } from "./datum";
import type { Query } from "./query";
import type { ValueProxy, ValueProxyOrValue } from "./valueproxy";
import { QueryStage } from "./stages";

export {
  IsQueryStage,
  QueryStage,
  type QueryStageMap,
  type IndexBound,
  type IndexKeys,
  type IndexValue,
  type QueryStageName,
  type SelectionKey,
} from "./stages";

export type StagedConstructor<T extends StagedObject = StagedObject> = new (
  newStage: QueryStage,
  previous?: StagedObject,
) => T;

/**
 * A value every adapter writes and reads back as it was given: text, a number,
 * a boolean, `null`, a date, a list of values or a nested document. `undefined`
 * writes no value. A `bigint` or a `symbol` is not one: MongoDB truncates a
 * `bigint` to 64 bits and drops a `symbol`, RethinkDB refuses a `bigint` and
 * drops a `symbol`, and PostgreSQL refuses both.
 */
export type WriteValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | readonly WriteValue[]
  | WriteDocument;

/**
 * What a builder records as the operand of a stage: another staged object (a
 * value proxy, a datum, a stream or a query), a value every adapter reads as
 * given, a list of operands or a record of operands.
 */
export type QueryValue =
  | StagedObject
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | readonly QueryValue[]
  | QueryRecord;

/** A record whose fields are operands. */
export interface QueryRecord {
  [field: string]: QueryValue;
}

/**
 * The part of `V` that a stage records as given: a scalar or a date, a staged
 * object, a list, or an object (mapped, so a type declared with `interface`
 * qualifies) whose members qualify. A `bigint`, a `symbol` and a function map
 * to `never`, a type `unknown` to {@link QueryValue}, and an `any` stays `any`.
 */
export type OperandValue<V> = 0 extends 1 & V
  ? V & QueryValue
  : unknown extends V
    ? QueryValue
    : V extends DeepPartialLeaf
      ? V
      : V extends StagedObject
        ? V
        : V extends Function
          ? never
          : V extends readonly (infer U)[]
            ? readonly OperandValue<U>[]
            : V extends object
              ? { [K in keyof V]: OperandValue<V[K]> }
              : never;

/**
 * A field of `T`, or a dot-separated path that starts at one of its fields.
 * Each dot steps into a nested object, so `"title.fr"` reads `fr` inside
 * `title`, never a top-level key named `title.fr`.
 *
 * The path after the first field is not checked against the field's type: a
 * localized field is typed `string` while it stores a locale record, and a
 * strict path type would reject `"title.fr"`.
 */
export type FieldPath<T> = (keyof T & string) | `${keyof T & string}.${string}`;

/** A document as `insert`, `update` and `replace` record it. */
export interface WriteDocument {
  [field: string]: WriteValue;
}

type DeepPartialLeaf = string | number | boolean | null | undefined | Date;

type DeepPartialValue<V> = 0 extends 1 & V
  ? V & WriteValue
  : unknown extends V
    ? WriteValue
    : V extends DeepPartialLeaf
      ? V
      : V extends Array<infer U>
        ? Array<DeepPartialValue<U>>
        : V extends ReadonlyArray<infer U>
          ? ReadonlyArray<DeepPartialValue<U>>
          : V extends object
            ? DeepPartial<V>
            : never;

/**
 * A partial document: every object field optional, recursively. Scalars,
 * `null` and dates are kept as they are, a list keeps partial elements, a
 * field typed `unknown` takes a {@link WriteValue}, and an `any` field stays
 * `any`, so a full document is its own partial. A type no provider stores,
 * such as `bigint` or `symbol`, becomes `never`. The top level maps `T`'s
 * keys, so a model generic over `T` can still pass a record it built.
 */
export type DeepPartial<T> = { [K in keyof T]?: DeepPartialValue<T[K]> };

/**
 * Change event
 */
export interface Changes<T> {
  /**
   * The type of change that occured
   *
   * Possible values: added, removed, modified
   */
  changeType: "added" | "removed" | "modified";

  /**
   * Value prior to the change
   */
  oldValue?: T;

  /**
   * New value after the change
   */
  newValue?: T;
}

export interface InsertOptions {
  conflict?: "update" | "replace";
}

function isStagedConstructor(
  candidate: Function,
): candidate is StagedConstructor {
  return (
    candidate === StagedObject || candidate.prototype instanceof StagedObject
  );
}

function ownConstructor(instance: StagedObject): StagedConstructor {
  const constructor = instance.constructor;
  if (!isStagedConstructor(constructor)) {
    throw new TypeError(
      "A staged object must be built by a StagedObject class",
    );
  }
  return constructor;
}

function argument<A extends StagedObject>(
  type: StagedConstructor<A>,
  id: number,
) {
  return { id, value: new type(QueryStage("arg", undefined, id)) };
}

export class StagedObject {
  protected readonly stages: QueryStage[];

  /**
   * Records `newStage` after the stages of `previous`, or as the first stage.
   *
   * @param newStage Stage to record
   * @param previous Object whose stages come first
   */
  public constructor(newStage: QueryStage, previous?: StagedObject);
  /**
   * Records no stage: the new object holds the stages of `previous`, so the
   * same query reads as another class or type.
   *
   * @param newStage `undefined`, as no stage is recorded
   * @param previous Object whose stages are copied
   */
  public constructor(newStage: undefined, previous: StagedObject);
  public constructor(
    newStage: QueryStage | undefined,
    previous?: StagedObject,
  ) {
    if (newStage !== undefined) {
      this.stages = previous ? [...previous.stages, newStage] : [newStage];
      return;
    }
    if (!previous) {
      throw new TypeError(
        "A staged object that records no stage copies a previous one",
      );
    }
    this.stages = [...previous.stages];
  }

  /** @internal */
  public build() {
    return this.stages;
  }

  protected stage(type: undefined, newStage: QueryStage): this;
  protected stage<T extends StagedObject>(
    type: StagedConstructor<T>,
    newStage: QueryStage,
  ): T;
  protected stage<T extends StagedObject>(
    type: StagedConstructor<T> | undefined,
    newStage: QueryStage,
  ) {
    const Constructor = type ?? ownConstructor(this);
    return new Constructor(newStage, this);
  }

  private static nextargid = 0;

  /**
   * Records `func` as a function stage: `func` runs once, on an argument of
   * class `a`, and the stage records what it returns.
   *
   * @param func Function to record
   * @param a Class of its argument
   * @returns The function stage
   */
  protected callfunc<A extends StagedObject>(
    func: (a: A) => any,
    a: StagedConstructor<A>,
  ): QueryStage<"func">;
  /**
   * Records `func` as a function stage: `func` runs once, on arguments of
   * classes `a` and `b`, and the stage records what it returns.
   *
   * @param func Function to record
   * @param a Class of its first argument
   * @param b Class of its second argument
   * @returns The function stage
   */
  protected callfunc<A extends StagedObject, B extends StagedObject>(
    func: (a: A, b: B) => any,
    a: StagedConstructor<A>,
    b: StagedConstructor<B>,
  ): QueryStage<"func">;
  protected callfunc<A extends StagedObject, B extends StagedObject>(
    ...call:
      | [func: (a: A) => any, a: StagedConstructor<A>]
      | [
          func: (a: A, b: B) => any,
          a: StagedConstructor<A>,
          b: StagedConstructor<B>,
        ]
  ): QueryStage<"func"> {
    if (call.length === 2) {
      const [func, a] = call;
      const first = argument(a, StagedObject.nextargid++);
      return { stage: "func", args: [[first.id], func(first.value)] };
    }
    const [func, a, b] = call;
    const first = argument(a, StagedObject.nextargid++);
    const second = argument(b, StagedObject.nextargid++);
    return {
      stage: "func",
      args: [[first.id, second.id], func(first.value, second.value)],
    };
  }
}

export type Value<T> = Datum<T> | ValueProxyOrValue<T>;

type ExtractTypeObject<T> = T extends infer O
  ? {
      [K in keyof O]: ExtractType<O[K]>;
    }
  : never;
export type ExtractType<T> =
  T extends ValueProxy<infer A>
    ? A
    : T extends Query<infer A>
      ? A
      : T extends Record<PropertyKey, T[keyof T]>
        ? ExtractTypeObject<T>
        : T extends Array<infer A>
          ? Array<ExtractType<A>>
          : T;
