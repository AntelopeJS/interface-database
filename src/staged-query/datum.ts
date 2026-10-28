import { Query } from "./query";
import { ValueProxy } from "./valueproxy";
import type { Selection } from "./selection";
import type { ExtractType, Value } from "./common";
import { HasKind, MarkKind } from "./kind";

const DATUM_KIND = Symbol.for("@antelopejs/interface-database/Datum@1");

export class Datum<T> extends Query<T> {
  /**
   * Changes the type of this datum.
   * This does not actually perform any conversion, it only changes the typescript type.
   *
   * @returns Same datum with a different type
   */
  public cast<U>(): Datum<U>;
  public cast() {
    return this;
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
  public key<K extends keyof NonNullable<T>, U = undefined>(key: K, def?: U) {
    return this.stage(
      Datum<
        U extends undefined
          ? NonNullable<T>[K]
          : NonNullable<NonNullable<T>[K]> | U
      >,
      "key",
      undefined,
      key,
      def,
    );
  }

  /**
   * Defaults the datum to a given value if it is null.
   *
   * @param value Default value
   * @returns Current datum or given value
   */
  public default<U>(val: Value<U>) {
    return this.stage(
      Datum<Exclude<T, undefined | null> | U>,
      "default",
      undefined,
      val,
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
      "map",
      undefined,
      this.callfunc(mapper, ValueProxy<T>),
    );
  }

  /**
   * Perform a foreign key lookup
   *
   * @param other Other table
   * @param localKey Key in local object
   * @param otherKey Key in other table
   */
  public lookup<U = any, TK extends keyof T = keyof T>(
    other: Selection<U>,
    localKey: TK,
    otherKey: keyof U,
  ) {
    return this.stage(
      Datum<Omit<T, TK> & Record<TK, T[TK] extends any[] ? U[] : U>>,
      "lookup",
      { localKey, otherKey },
      other,
    );
  }

  /**
   * Plucks fields from the documents.
   *
   * TODO: Better typing
   *
   * @param fields Fields to keep
   * @returns New datum
   */
  public pluck(...fields: string[]) {
    return this.stage(Datum<Partial<T>>, "pluck", undefined, fields);
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
  return HasKind(value, DATUM_KIND);
}
