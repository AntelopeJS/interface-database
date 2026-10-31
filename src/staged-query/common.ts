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

/** A document as `insert`, `update` and `replace` record it. */
export interface WriteDocument {
  [field: string]: WriteValue;
}

type DeepPartialLeaf = string | number | boolean | null | undefined | Date;

type DeepPartialValue<V> = unknown extends V
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

export class StagedObject {
  protected readonly stages: QueryStage[];

  public constructor(newStage: QueryStage, previous?: StagedObject) {
    this.stages = previous ? [...previous.stages, newStage] : [newStage];
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
  protected callfunc<T extends StagedObject[]>(
    func: (...args: T) => any,
    ...args: (typeof StagedObject)[]
  ): QueryStage<"func"> {
    const argNumbers: number[] = [];
    const argValues: StagedObject[] = [];
    for (let i = 0; i < args.length; ++i) {
      const id = StagedObject.nextargid++;
      argNumbers[i] = id;
      argValues[i] = new args[i](QueryStage("arg", undefined, id));
    }
    /*
     * SAFETY: argValues[i] is built by `new args[i]`, so it is an instance of
     * the i-th class passed. T is inferred from func alone, so the cast holds
     * when func's i-th parameter is an instance of that class; every caller in
     * staged-query passes ValueProxy or Stream for the parameter typed
     * ValueProxy or Stream, and only a type argument, which has no runtime
     * form, may differ.
     */
    return {
      stage: "func",
      args: [argNumbers, func(...(argValues as T))],
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
