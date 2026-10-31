import type { AtomicMutation, AtomicRecord } from "./atomic";
import type { InsertOptions, Value } from "./common";
import type { InstanceId } from "./schema";
import type { Query } from "./query";
import type { ValueProxyOrValue } from "./valueproxy";

/**
 * A key `getAll` and `between` match against an index: one value, or the
 * values of a compound index in its field order.
 */
export type SelectionKey = string | number | boolean;

/**
 * The keys `getAll` matches: one key, a list of keys, or a list of compound
 * keys, each holding a compound index's values in its field order.
 */
export type IndexKeys =
  | ValueProxyOrValue<SelectionKey>
  | ValueProxyOrValue<SelectionKey>[]
  | SelectionKey[][];

type Func = QueryStage<"func">;
type NoOptions = undefined;

interface Recorded<Options, Args extends readonly unknown[]> {
  options: Options;
  args: Args;
}

type FieldOptions = { field?: string };

/**
 * The options and arguments of every stage the builders record, by stage name.
 * Adapters read a stage through `QueryStage<Name>`, which this map types.
 */
export interface QueryStageMap {
  schema: Recorded<{ id: string }, []>;
  instance: Recorded<{ id?: InstanceId }, []>;
  createInstance: Recorded<{ id?: string }, []>;
  destroyInstance: Recorded<{ id?: string }, []>;
  listInstances: Recorded<NoOptions, []>;
  table: Recorded<{ id: string }, []>;

  arg: Recorded<NoOptions, [id: number]>;
  func: Recorded<NoOptions, [argIds: number[], body: Value<unknown>]>;
  constant: Recorded<NoOptions, [value: Value<unknown>]>;

  atomicMutation: Recorded<
    NoOptions,
    [key: string, request: AtomicMutation<AtomicRecord>]
  >;
  insert: Recorded<InsertOptions | undefined, [documents: object | object[]]>;
  update: Recorded<NoOptions, [document: object | Func]>;
  replace: Recorded<NoOptions, [document: object]>;
  delete: Recorded<NoOptions, []>;
  changes: Recorded<NoOptions, []>;
  get: Recorded<NoOptions, [key: ValueProxyOrValue<string>]>;
  getAll: Recorded<{ index?: string }, [keys: IndexKeys]>;
  between: Recorded<
    { index: string },
    [low: Value<unknown>, high: Value<unknown>]
  >;

  key: Recorded<NoOptions, [key: string, defaultValue?: Value<unknown>]>;
  default: Recorded<NoOptions, [value: Value<unknown>]>;
  map: Recorded<NoOptions, [mapper: Func]>;
  filter: Recorded<NoOptions, [predicate: Func]>;
  pluck: Recorded<NoOptions, [fields: string[]]>;
  without: Recorded<NoOptions, [fields: string[]]>;
  union: Recorded<NoOptions, [other: Query<unknown[]>]>;
  join: Recorded<
    { innerOnly: boolean },
    [right: Query<unknown[]>, predicate: Func, mapper: Func]
  >;
  lookup: Recorded<
    { localKey: string; otherKey: string },
    [other: Query<unknown[]>]
  >;
  group: Recorded<{ index: string }, [mapper: Func]>;
  orderBy: Recorded<{ index: string; direction?: "asc" | "desc" }, []>;
  slice: Recorded<NoOptions, [offset: Value<number>, count?: Value<number>]>;
  nth: Recorded<NoOptions, [index: Value<number>]>;
  count: Recorded<FieldOptions, []>;
  sum: Recorded<FieldOptions, []>;
  avg: Recorded<FieldOptions, []>;
  min: Recorded<FieldOptions, []>;
  max: Recorded<FieldOptions, []>;
  distinct: Recorded<FieldOptions, []>;

  and: Recorded<
    NoOptions,
    [value: ValueProxyOrValue<boolean | null | undefined>]
  >;
  or: Recorded<
    NoOptions,
    [value: ValueProxyOrValue<boolean | null | undefined>]
  >;
  not: Recorded<NoOptions, []>;
  eq: Recorded<NoOptions, [value: Value<unknown>]>;
  ne: Recorded<NoOptions, [value: Value<unknown>]>;
  add: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  sub: Recorded<NoOptions, [value: Value<unknown>]>;
  mul: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  div: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  mod: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  round: Recorded<NoOptions, []>;
  ceil: Recorded<NoOptions, []>;
  floor: Recorded<NoOptions, []>;
  bit_and: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  bit_or: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  bit_xor: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  bit_not: Recorded<NoOptions, []>;
  bit_lshift: Recorded<NoOptions, [value: ValueProxyOrValue<number>]>;
  bit_rshift: Recorded<
    { preserveSign: boolean } | undefined,
    [value: ValueProxyOrValue<number>]
  >;
  cmp_gt: Recorded<NoOptions, [value: Value<unknown>]>;
  cmp_ge: Recorded<NoOptions, [value: Value<unknown>]>;
  cmp_lt: Recorded<NoOptions, [value: Value<unknown>]>;
  cmp_le: Recorded<NoOptions, [value: Value<unknown>]>;

  date_during: Recorded<
    NoOptions,
    [left: ValueProxyOrValue<Date>, right: ValueProxyOrValue<Date>]
  >;
  date_with_timezone: Recorded<
    NoOptions,
    [timezone: ValueProxyOrValue<string>]
  >;
  date_tod: Recorded<NoOptions, []>;
  date_year: Recorded<NoOptions, []>;
  date_month: Recorded<NoOptions, []>;
  date_day: Recorded<NoOptions, []>;
  date_dow: Recorded<NoOptions, []>;
  date_doy: Recorded<NoOptions, []>;
  date_hours: Recorded<NoOptions, []>;
  date_minutes: Recorded<NoOptions, []>;
  date_seconds: Recorded<NoOptions, []>;
  date_epoch: Recorded<NoOptions, []>;

  str_split: Recorded<{ separator?: string; maxSplits?: number }, []>;
  str_concat: Recorded<NoOptions, [value: ValueProxyOrValue<string>]>;
  str_upcase: Recorded<NoOptions, []>;
  str_downcase: Recorded<NoOptions, []>;
  str_len: Recorded<NoOptions, []>;
  str_match: Recorded<NoOptions, [regex: ValueProxyOrValue<string>]>;

  arr_index: Recorded<NoOptions, [index: ValueProxyOrValue<number>]>;
  arr_includes: Recorded<NoOptions, [value: Value<unknown>]>;
  arr_slice: Recorded<
    NoOptions,
    [start: ValueProxyOrValue<number>, end?: ValueProxyOrValue<number>]
  >;
  arr_map: Recorded<NoOptions, [mapper: Func]>;
  arr_filter: Recorded<NoOptions, [predicate: Func]>;
  arr_empty: Recorded<NoOptions, []>;
  arr_count: Recorded<NoOptions, []>;
  arr_sum: Recorded<NoOptions, []>;
  arr_avg: Recorded<NoOptions, []>;
  arr_min: Recorded<NoOptions, []>;
  arr_max: Recorded<NoOptions, []>;

  obj_index: Recorded<
    NoOptions,
    [key: Value<unknown>, defaultValue?: Value<unknown>]
  >;
  obj_merge: Recorded<NoOptions, [value: Value<unknown>]>;
  obj_keys: Recorded<NoOptions, []>;
  obj_values: Recorded<NoOptions, []>;
  obj_has: Recorded<NoOptions, [fields: string[]]>;
}

export type QueryStageName = keyof QueryStageMap;

type StageOptions<Stage extends QueryStageName> =
  undefined extends QueryStageMap[Stage]["options"]
    ? { options?: QueryStageMap[Stage]["options"] }
    : { options: QueryStageMap[Stage]["options"] };

/**
 * A recorded stage. `QueryStage` alone is the union of every stage, which an
 * adapter narrows on `stage`; `QueryStage<"get">` is one stage.
 */
export type QueryStage<Name extends QueryStageName = QueryStageName> = {
  [Stage in Name]: {
    stage: Stage;
    args: QueryStageMap[Stage]["args"];
  } & StageOptions<Stage>;
}[Name];

/** Records one stage, typed by its name. */
export function QueryStage<Name extends QueryStageName>(
  stage: Name,
  options: QueryStageMap[Name]["options"],
  ...args: QueryStageMap[Name]["args"]
): QueryStage<Name> {
  return { stage, options, args };
}
