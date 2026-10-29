import type { Datum } from "./datum";
import type { Query } from "./query";
import type { ValueProxy, ValueProxyOrValue } from "./valueproxy";

export type StagedConstructor<T extends StagedObject = StagedObject> = new (
  newStage: QueryStage,
  previous?: StagedObject,
) => T;

/**
 * Recursive Partial generic type
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U1>
    ? Array<DeepPartial<U1>>
    : T[K] extends ReadonlyArray<infer U2>
      ? ReadonlyArray<DeepPartial<U2>>
      : DeepPartial<T[K]>;
};

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

export interface QueryStage {
  stage: string;
  options?: any;
  args: any[];
}

export function QueryStage(stage: string, options?: any, ...args: any[]) {
  return {
    stage,
    options,
    args,
  };
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

  protected stage(
    type: undefined,
    stage: string,
    options?: any,
    ...args: any[]
  ): this;
  protected stage<T extends StagedObject>(
    type: StagedConstructor<T>,
    stage: string,
    options?: any,
    ...args: any[]
  ): T;
  protected stage<T extends StagedObject>(
    type: StagedConstructor<T> | undefined,
    stage: string,
    options?: any,
    ...args: any[]
  ) {
    const Constructor = type ?? ownConstructor(this);
    return new Constructor(
      {
        stage,
        options,
        args,
      },
      this,
    );
  }

  private static nextargid = 0;
  protected callfunc<T extends StagedObject[]>(
    func: (...args: T) => any,
    ...args: (typeof StagedObject)[]
  ): QueryStage {
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
