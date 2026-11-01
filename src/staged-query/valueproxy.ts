import {
  QueryStage,
  StagedObject,
  type ExtractType,
  type QueryValue,
  type StagedConstructor,
} from "./common";
import { MarkKind } from "./kind";
import type {
  AddOperand,
  ArrayValue,
  Is,
  IsArray,
  OnlyObject,
  QueryOperand,
} from "./valueproxy-conditions";
import { VALUEPROXY_KIND } from "./valueproxy-kind";

export type ValueProxyOrValue<T> = ValueProxy<T> | T;

export type {
  AddOperand,
  ArrayValue,
  Is,
  IsArray,
  OnlyObject,
  QueryOperand,
} from "./valueproxy-conditions";
export { IsValueProxy } from "./valueproxy-kind";

/**
 * Proxy to an actual value in the database
 *
 * Actions performed on this proxy are not executed right away but instead recorded for the actual query
 */
export class ValueProxy<T> extends StagedObject {
  /** @internal */
  public static arg<T = unknown>(id: number) {
    return new ValueProxy<T>(QueryStage("arg", undefined, id));
  }

  /**
   * Create a new proxy with a constant value
   *
   * @param value Value
   * @returns Proxy
   */
  public static constant<T = unknown>(value: T & QueryValue) {
    return new ValueProxy<T>(QueryStage("constant", undefined, value));
  }

  static #stageOf<Source, Result extends StagedObject>(
    proxy: ValueProxy<Source>,
    type: StagedConstructor<Result>,
    newStage: QueryStage,
  ): Result {
    return proxy.stage(type, newStage);
  }

  /**
   * Changes the type of this proxy.
   * This does not actually perform any conversion, it only changes the typescript type.
   *
   * @returns Same proxy with a different type
   */
  public cast<U>() {
    /*
     * SAFETY: A ValueProxy keeps no value of type T. Its only state is the
     * `stages` array, whose type does not depend on T, so the same object is
     * a valid ValueProxy<U> for every U. U matching the query is the caller's
     * claim.
     */
    // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- a single `as` fails TS2352 (T and U unrelated); widening to StagedObject first is refused.
    return this as unknown as ValueProxy<U>;
  }

  /**
   * Returns the parameter if the proxy is null.
   *
   * @param value Value to use in case the proxy is null
   * @returns Non-null value.
   */
  public default<U>(value: QueryOperand<U>) {
    return this.stage(
      ValueProxy<Exclude<T, undefined | null> | U>,
      QueryStage("default", undefined, value),
    );
  }

  /**
   * AND operator.
   *
   * @param value Operand B, a boolean or a proxy of a boolean, possibly null or undefined
   * @returns A && B
   */
  public and<U extends boolean | null | undefined>(
    value: ValueProxyOrValue<U>,
  ) {
    return this.stage(ValueProxy<boolean>, QueryStage("and", undefined, value));
  }

  /**
   * OR operator.
   *
   * @param value Operand B, a boolean or a proxy of a boolean, possibly null or undefined
   * @returns A || B
   */
  public or<U extends boolean | null | undefined>(value: ValueProxyOrValue<U>) {
    return this.stage(ValueProxy<boolean>, QueryStage("or", undefined, value));
  }

  /**
   * NOT operator.
   *
   * @returns !A
   */
  public not() {
    return this.stage(ValueProxy<boolean>, QueryStage("not", undefined));
  }

  /**
   * Equality operator.
   *
   * @param value Operand B: a constant of this value's type, or any expression
   * @returns A == B
   */
  public eq(value: StagedObject | (T & QueryValue)) {
    return this.stage(ValueProxy<boolean>, QueryStage("eq", undefined, value));
  }

  /**
   * Inequality operator.
   *
   * @param value Operand B: a constant of this value's type, or any expression
   * @returns A != B
   */
  public ne(value: StagedObject | (T & QueryValue)) {
    return this.stage(ValueProxy<boolean>, QueryStage("ne", undefined, value));
  }

  /**
   * Addition operator: adds seconds to a date, adds two numbers, or concatenates
   * two strings or two lists.
   *
   * @param value Operand B
   * @returns New value, or null when operand B is null
   */
  public add(
    this: Is<Date | number | string, T, this> | IsArray<unknown, T, this>,
    value: AddOperand<T>,
  ) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<T>,
      QueryStage("add", undefined, value),
    );
  }

  /**
   * Subtraction operator.
   *
   * @param other Operand B
   * @returns New value
   */
  public sub<U>(this: Is<Date | number, T, this>, value: QueryOperand<U>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<
        Date extends U
          ?
              | (Date extends T ? number : never)
              | (number extends U ? (T extends number ? number : Date) : never)
          : Extract<Date | number, T>
      >,
      QueryStage("sub", undefined, value),
    );
  }

  /**
   * Determines whether or not the proxy is between the two bounds.
   *
   * @param left Left bound (inclusive): a date, or milliseconds since the UNIX epoch
   * @param right Right bound (exclusive): a date, or milliseconds since the UNIX epoch
   * @returns True if the date is within the bounds
   */
  public during<Bound extends Date | number>(
    this: Is<Date, T, this>,
    left: ValueProxyOrValue<Bound>,
    right: ValueProxyOrValue<Bound>,
  ) {
    return this.stage(
      ValueProxy<boolean>,
      QueryStage("date_during", undefined, left, right),
    );
  }

  /** @internal */
  private withTimezone(timezone?: ValueProxyOrValue<string>) {
    if (timezone) {
      return this.stage(
        ValueProxy<Date>,
        QueryStage("date_with_timezone", undefined, timezone),
      );
    }
    return this.cast<Date>();
  }

  /**
   * Number of seconds since the start of the day.
   *
   * @returns Seconds
   */
  public timeofday(
    this: Is<Date, T, this>,
    timezone?: ValueProxyOrValue<string>,
  ) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_tod", undefined),
    );
  }

  /**
   * Year.
   *
   * @returns Year
   */
  public year(this: Is<Date, T, this>, timezone?: ValueProxyOrValue<string>) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_year", undefined),
    );
  }

  /**
   * Month.
   *
   * @returns Month
   */
  public month(this: Is<Date, T, this>, timezone?: ValueProxyOrValue<string>) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_month", undefined),
    );
  }

  /**
   * Day of the month.
   *
   * @returns Day of the month
   */
  public day(this: Is<Date, T, this>, timezone?: ValueProxyOrValue<string>) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_day", undefined),
    );
  }

  /**
   * Day of the week.
   *
   * @returns Day of the week
   */
  public dayofweek(
    this: Is<Date, T, this>,
    timezone?: ValueProxyOrValue<string>,
  ) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_dow", undefined),
    );
  }

  /**
   * Day of the year.
   *
   * @returns Day of the year
   */
  public dayofyear(
    this: Is<Date, T, this>,
    timezone?: ValueProxyOrValue<string>,
  ) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_doy", undefined),
    );
  }

  /**
   * Hour of the day.
   *
   * @returns Hours
   */
  public hours(this: Is<Date, T, this>, timezone?: ValueProxyOrValue<string>) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_hours", undefined),
    );
  }

  /**
   * Minutes.
   *
   * @returns Minutes
   */
  public minutes(
    this: Is<Date, T, this>,
    timezone?: ValueProxyOrValue<string>,
  ) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_minutes", undefined),
    );
  }

  /**
   * Seconds.
   *
   * @returns Seconds
   */
  public seconds(
    this: Is<Date, T, this>,
    timezone?: ValueProxyOrValue<string>,
  ) {
    return this.withTimezone(timezone).stage(
      ValueProxy<number>,
      QueryStage("date_seconds", undefined),
    );
  }

  /**
   * Seconds since the UNIX epoch with millisecond precision.
   *
   * @returns Seconds
   */
  public epoch(this: Is<Date, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("date_epoch", undefined));
  }

  /**
   * Multiplication operator.
   *
   * @param other Operand B
   * @returns A * B
   */
  public mul(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(ValueProxy<number>, QueryStage("mul", undefined, other));
  }

  /**
   * Division operator.
   *
   * @param other Operand B
   * @returns A / B
   */
  public div(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(ValueProxy<number>, QueryStage("div", undefined, other));
  }

  /**
   * Modulo operator.
   *
   * @param other Operand B
   * @returns A % B
   */
  public mod(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(ValueProxy<number>, QueryStage("mod", undefined, other));
  }

  /**
   * Round to the nearest integer.
   *
   * @returns Integer
   */
  public round(this: Is<number, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("round", undefined));
  }

  /**
   * Round to the higher integer.
   *
   * @returns Integer
   */
  public ceil(this: Is<number, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("ceil", undefined));
  }

  /**
   * Round to the lower integer.
   *
   * @returns Integer
   */
  public floor(this: Is<number, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("floor", undefined));
  }

  /**
   * Bitwise AND operator.
   *
   * @param other Operand B
   * @return A & B
   */
  public band(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(
      ValueProxy<number>,
      QueryStage("bit_and", undefined, other),
    );
  }

  /**
   * Bitwise OR operator.
   *
   * @param other Operand B
   * @return A | B
   */
  public bor(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(
      ValueProxy<number>,
      QueryStage("bit_or", undefined, other),
    );
  }

  /**
   * Bitwise XOR operator.
   *
   * @param other Operand B
   * @return A ^ B
   */
  public bxor(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(
      ValueProxy<number>,
      QueryStage("bit_xor", undefined, other),
    );
  }

  /**
   * Bitwise NOT operator.
   *
   * @return ~A
   */
  public bnot(this: Is<number, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("bit_not", undefined));
  }

  /**
   * Bitwise left shift operator.
   *
   * @param other Operand B
   * @returns A << B
   */
  public blshift(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(
      ValueProxy<number>,
      QueryStage("bit_lshift", undefined, other),
    );
  }

  /**
   * Bitwise right shift operator.
   *
   * @param other Operand B
   * @returns A >> B
   */
  public brshift(this: Is<number, T, this>, other: ValueProxyOrValue<number>) {
    return this.stage(
      ValueProxy<number>,
      QueryStage("bit_rshift", undefined, other),
    );
  }

  /**
   * Bitwise right shift operator with sign preservation.
   *
   * @param other Operand B
   * @returns A >> B (sign-preserving)
   */
  public brshiftPreserveSign(
    this: Is<number, T, this>,
    other: ValueProxyOrValue<number>,
  ) {
    return this.stage(
      ValueProxy<number>,
      QueryStage("bit_rshift", { preserveSign: true }, other),
    );
  }

  /**
   * Greater-than operator.
   *
   * @param other Operand B
   * @returns A > B
   */
  public gt(this: Is<Date | number | string, T, this>, other: QueryOperand<T>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<boolean>,
      QueryStage("cmp_gt", undefined, other),
    );
  }

  /**
   * Greater-or-equal operator.
   *
   * @param other Operand B
   * @returns A >= B
   */
  public ge(this: Is<Date | number | string, T, this>, other: QueryOperand<T>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<boolean>,
      QueryStage("cmp_ge", undefined, other),
    );
  }

  /**
   * Lesser-than operator.
   *
   * @param other Operand B
   * @returns A < B
   */
  public lt(this: Is<Date | number | string, T, this>, other: QueryOperand<T>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<boolean>,
      QueryStage("cmp_lt", undefined, other),
    );
  }

  /**
   * Lesser-or-equal operator.
   *
   * @param other Operand B
   * @returns A <= B
   */
  public le(this: Is<Date | number | string, T, this>, other: QueryOperand<T>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<boolean>,
      QueryStage("cmp_le", undefined, other),
    );
  }

  /**
   * Splits the string using a separator.
   *
   * @param separator Separator string
   * @param maxSplits Maximum number of results
   * @returns Array of sub-strings
   */
  public split(
    this: Is<string, T, this>,
    separator?: string,
    maxSplits?: number,
  ) {
    return this.stage(
      ValueProxy<string[]>,
      QueryStage("str_split", {
        separator,
        maxSplits,
      }),
    );
  }

  /**
   * Concatenate the string with another.
   *
   * @param other Second string
   * @returns Concatenated string
   */
  public concat(this: Is<string, T, this>, other: ValueProxyOrValue<string>) {
    return this.stage(
      ValueProxy<string>,
      QueryStage("str_concat", undefined, other),
    );
  }

  /**
   * Converts the string to all upper case.
   *
   * @returns New string
   */
  public upcase(this: Is<string, T, this>) {
    return this.stage(ValueProxy<string>, QueryStage("str_upcase", undefined));
  }

  /**
   * Converts the string to all lower case.
   *
   * @returns New string
   */
  public downcase(this: Is<string, T, this>) {
    return this.stage(
      ValueProxy<string>,
      QueryStage("str_downcase", undefined),
    );
  }

  /**
   * Gets the number of Unicode codepoints in the string.
   *
   * @returns Number of codepoints
   */
  public strlen(this: Is<string, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("str_len", undefined));
  }

  /**
   * Checks if the string matches a regex.
   *
   * @param regex Regex
   * @returns True if the string matched
   */
  public match(this: Is<string, T, this>, regex: ValueProxyOrValue<string>) {
    return this.stage(
      ValueProxy<boolean>,
      QueryStage("str_match", undefined, regex),
    );
  }

  /**
   * Indexes the array with a given number position
   *
   * @param key Position in the array
   * @returns Element at the given position
   */
  public index(
    this: IsArray<unknown, T, this>,
    key: ValueProxyOrValue<number>,
  ) {
    return this.stage(
      ValueProxy<ArrayValue<T>>,
      QueryStage("arr_index", undefined, key),
    );
  }

  /**
   * Tests if the arrays contains a value.
   *
   * @param val Value to search for.
   * @returns True if the value was found.
   */
  public includes(
    this: IsArray<unknown, T, this>,
    val: QueryOperand<ArrayValue<T>>,
  ) {
    return this.stage(
      ValueProxy<boolean>,
      QueryStage("arr_includes", undefined, val),
    );
  }

  /**
   * Returns a slice of the array.
   *
   * @param start Start index (inclusive, 0-indexed)
   * @param end End index (exclusive)
   * @returns Sub-array
   */
  public slice(
    this: IsArray<unknown, T, this>,
    start: ValueProxyOrValue<number>,
    end?: ValueProxyOrValue<number>,
  ) {
    return this.stage(
      ValueProxy<Array<ArrayValue<T>>>,
      QueryStage("arr_slice", undefined, start, end),
    );
  }

  /**
   * Maps the array values using a mapping function.
   *
   * @param mapper Mapping function
   * @returns New array
   */
  public map<U>(
    this: IsArray<unknown, T, this>,
    mapper: (val: ValueProxy<ArrayValue<T>>) => U,
  ) {
    return this.stage(
      ValueProxy<ExtractType<U>[]>,
      QueryStage(
        "arr_map",
        undefined,
        this.callfunc(mapper, ValueProxy<ArrayValue<T>>),
      ),
    );
  }

  /**
   * Filters the array using a predicate function.
   *
   * @param predicate Predicate function. A number keeps the element unless it is 0.
   * @returns Filtered array
   */
  public filter(
    this: IsArray<unknown, T, this>,
    predicate: (
      val: ValueProxy<ArrayValue<T>>,
    ) => ValueProxyOrValue<boolean> | ValueProxyOrValue<number>,
  ) {
    return this.stage(
      ValueProxy<Array<ArrayValue<T>>>,
      QueryStage(
        "arr_filter",
        undefined,
        this.callfunc(predicate, ValueProxy<ArrayValue<T>>),
      ),
    );
  }

  /**
   * Checks if the array is empty.
   *
   * @returns True if the array is empty
   */
  public isempty(this: IsArray<unknown, T, this>) {
    return this.stage(ValueProxy<boolean>, QueryStage("arr_empty", undefined));
  }

  /**
   * Gets the length of the array.
   *
   * @returns Length
   */
  public count(this: IsArray<unknown, T, this>) {
    return this.stage(ValueProxy<number>, QueryStage("arr_count", undefined));
  }

  /**
   * Gets the sum of a number array.
   *
   * @returns Sum
   */
  public sum(this: IsArray<number, T, this>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<number>,
      QueryStage("arr_sum", undefined),
    );
  }

  /**
   * Gets the average of a number array.
   *
   * @returns Average
   */
  public avg(this: IsArray<number, T, this>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<number>,
      QueryStage("arr_avg", undefined),
    );
  }

  /**
   * Gets the minimum of an array of numbers, strings or dates.
   *
   * @returns Minimum
   */
  public min(this: IsArray<Date | number | string, T, this>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<ArrayValue<T>>,
      QueryStage("arr_min", undefined),
    );
  }

  /**
   * Gets the maximum of an array of numbers, strings or dates.
   *
   * @returns Maximum
   */
  public max(this: IsArray<Date | number | string, T, this>) {
    return ValueProxy.#stageOf(
      this,
      ValueProxy<ArrayValue<T>>,
      QueryStage("arr_max", undefined),
    );
  }

  /**
   * Indexes the object.
   *
   * TODO: Better name?
   *
   * @param key Field name
   * @param def Default value
   * @returns Value of the field
   */
  public key<TO = OnlyObject<T>, K extends keyof TO = keyof TO, U = undefined>(
    this: Is<T, object, this>,
    key: QueryOperand<K>,
    def?: QueryOperand<U>,
  ) {
    return this.stage(
      ValueProxy<
        U extends undefined ? TO[K] : Exclude<TO[K], undefined | null> | U
      >,
      QueryStage("obj_index", undefined, key, def),
    );
  }

  /**
   * Merges the object with another.
   *
   * @param value Other object
   * @returns `{...A, ...B}`
   */
  public merge<U, TO = OnlyObject<T>>(
    this: Is<T, object, this>,
    other: QueryOperand<U>,
  ) {
    return this.stage(
      ValueProxy<Omit<TO, keyof U> & ExtractType<U>>,
      QueryStage("obj_merge", undefined, other),
    );
  }

  /**
   * Gets the keys of the object as an array.
   *
   * @returns Array of keys
   */
  public keys<TO = OnlyObject<T>>(this: Is<T, object, this>) {
    return this.stage(
      ValueProxy<Array<keyof TO>>,
      QueryStage("obj_keys", undefined),
    );
  }

  /**
   * Gets the values of the object as an array.
   *
   * @returns Array of values
   */
  public values<TO = OnlyObject<T>>(this: Is<T, object, this>) {
    return this.stage(
      ValueProxy<Array<TO[keyof TO]>>,
      QueryStage("obj_values", undefined),
    );
  }

  /**
   * Tests if the object has the specified fields.
   *
   * @param fields field list
   * @returns True if the object matches
   */
  public hasfields(this: Is<T, object, this>, ...fields: string[]) {
    return this.stage(
      ValueProxy<boolean>,
      QueryStage("obj_has", undefined, fields),
    );
  }
}

MarkKind(ValueProxy.prototype, VALUEPROXY_KIND);
