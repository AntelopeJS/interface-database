import { Query } from "./query";
import { ValueProxy } from "./valueproxy";
import type { Stream } from "./stream";
import {
  QueryStage,
  type ExtractType,
  type QueryValue,
  type Value,
} from "./common";
import { isKindHolder, MarkKind } from "./kind";

const DATUM_KIND = Symbol.for("@antelopejs/interface-database/Datum@1");

export class Datum<T> extends Query<T> {
  /**
   * Changes the type of this datum.
   * This does not actually perform any conversion, it only changes the typescript type.
   *
   * @returns Same datum with a different type
   */
  public cast<U>() {
    /*
     * SAFETY: A Datum keeps no value of type T. Its only instance state is the
     * `stages` array inherited from StagedObject, whose type does not depend on
     * T, so the same object is a valid Datum<U> for every U. Whether U matches
     * what the query yields is the caller's claim, which nothing here checks.
     */
    // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- a single `as Datum<U>` fails TS2352 because T and U are unrelated, and widening to StagedObject first is the refused route; the cast only relabels the type argument of the same object.
    return this as unknown as Datum<U>;
  }

  /**
   * Indexes the datum.
   *
   * TODO: Better name?
   * TODO: typing for compound keys (a.b.c)
   *
   * @param key Field name
   * @param def Default value
   * @returns New datum with the value
   */
  public key<
    K extends keyof NonNullable<T> & string,
    U extends QueryValue = undefined,
  >(
    key: K,
    def?: U,
  ): Datum<
    U extends undefined ? NonNullable<T>[K] : NonNullable<NonNullable<T>[K]> | U
  > {
    return this.stage(
      Datum<
        U extends undefined
          ? NonNullable<T>[K]
          : NonNullable<NonNullable<T>[K]> | U
      >,
      QueryStage("key", undefined, key, def),
    );
  }

  /**
   * Defaults the datum to a given value if it is null.
   *
   * @param value Default value
   * @returns Current datum or given value
   */
  public default<U extends QueryValue>(val: Value<U>) {
    return this.stage(
      Datum<Exclude<T, undefined | null> | U>,
      QueryStage("default", undefined, val),
    );
  }

  /**
   * Run a mapping function on the datum.
   *
   * @param mapper Mapping function
   * @returns New datum with the result of the mapper
   */
  public do<U>(mapper: (val: ValueProxy<T>) => U) {
    return this.stage(
      Datum<ExtractType<U>>,
      QueryStage("map", undefined, this.callfunc(mapper, ValueProxy<T>)),
    );
  }

  /**
   * Perform a foreign key lookup
   *
   * @param other Other table
   * @param localKey Key in local object
   * @param otherKey Key in other table
   */
  public lookup<U = any, TK extends keyof T & string = keyof T & string>(
    other: Stream<U>,
    localKey: TK,
    otherKey: keyof U & string,
  ) {
    return this.stage(
      Datum<Omit<T, TK> & Record<TK, T[TK] extends any[] ? U[] : U>>,
      QueryStage("lookup", { localKey, otherKey }, other),
    );
  }

  /**
   * Plucks fields from the documents.
   *
   * @param fields Fields to keep
   * @returns New datum
   */
  public pluck<K extends keyof NonNullable<T> & string>(...fields: K[]) {
    return this.stage(
      Datum<Pick<NonNullable<T>, K> | Extract<T, null | undefined>>,
      QueryStage("pluck", undefined, fields),
    );
  }
}

MarkKind(Datum.prototype, DATUM_KIND);

/**
 * Whether a value is a datum, built by any instance of this interface.
 *
 * Unlike `instanceof`, it also recognises objects built by the instance of
 * another provider binding.
 *
 * @param value Value to test
 * @returns True if the value is a datum
 */
export function IsDatum(value: unknown): value is Datum<unknown> {
  return isKindHolder(value) && value[DATUM_KIND] === true;
}
