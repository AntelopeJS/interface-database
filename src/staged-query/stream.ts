import { Datum } from "./datum";
import { Query } from "./query";
import {
  QueryStage,
  type Changes,
  type ExtractType,
  type QueryValue,
  type Value,
} from "./common";
import { ValueProxy, type ValueProxyOrValue } from "./valueproxy";
import { isKindHolder, MarkKind } from "./kind";

const STREAM_KIND = Symbol.for("@antelopejs/interface-database/Stream@1");

export class Stream<T> extends Query<T[]> {
  /**
   * Changes the type of the value in this stream.
   * This does not actually perform any conversion, it only changes the typescript type.
   *
   * @returns Same stream with a different type
   */
  public cast<U>() {
    /*
     * SAFETY: A Stream keeps no value of type T. Its only instance state is the
     * `stages` array inherited from StagedObject, whose type does not depend on
     * T, so the same object is a valid Stream<U> for every U. Whether U matches
     * what the query yields is the caller's claim, which nothing here checks.
     */
    // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- a single `as Stream<U>` fails TS2352 because T and U are unrelated, and widening to StagedObject first is the refused route; the cast only relabels the type argument of the same object.
    return this as unknown as Stream<U>;
  }

  /**
   * Indexes the stream value.
   *
   * TODO: Better name?
   *
   * @param key Field name, or an expression yielding it
   * @param def Default value
   * @returns New stream
   */
  public key<K extends keyof T & string, U extends QueryValue = undefined>(
    key: ValueProxyOrValue<K>,
    def?: U,
  ): Stream<U extends undefined ? T[K] : Exclude<T[K], undefined | null> | U> {
    return this.stage(
      Stream<U extends undefined ? T[K] : Exclude<T[K], undefined | null> | U>,
      QueryStage("key", undefined, key, def),
    );
  }

  /**
   * Defaults the stream value to a given value if it is null.
   *
   * @param value Default value
   * @returns Stream with non-null value
   */
  public default<U extends QueryValue>(val: Value<U>) {
    return this.stage(
      Stream<Exclude<T, undefined | null> | U>,
      QueryStage("default", undefined, val),
    );
  }

  /**
   * Maps the array values using a mapping function.
   *
   * @param mapper Mapping function
   * @returns New stream
   */
  public map<U>(mapper: (val: ValueProxy<T>) => U) {
    return this.stage(
      Stream<ExtractType<U>>,
      QueryStage("map", undefined, this.callfunc(mapper, ValueProxy<T>)),
    );
  }

  /**
   * Filters the array using a predicate function.
   *
   * @param predicate Predicate function.
   * @returns Filtered stream
   */
  public filter(predicate: (val: ValueProxy<T>) => ValueProxyOrValue<boolean>) {
    return this.stage(
      undefined,
      QueryStage("filter", undefined, this.callfunc(predicate, ValueProxy<T>)),
    );
  }

  /**
   * Selects specific fields in the documents, discarding the rest.
   *
   * @param fields Selected fields
   * @returns New stream
   */
  public pluck<K extends keyof T & string>(...fields: K[]) {
    return this.stage(
      Stream<Pick<T, K>>,
      QueryStage("pluck", undefined, fields),
    );
  }

  /**
   * Excludes specific fields in the documents
   *
   * @param fields Excluded fields
   * @returns New stream
   */
  public without<K extends keyof T & string>(...fields: K[]) {
    return this.stage(
      Stream<Omit<T, K>>,
      QueryStage("without", undefined, fields),
    );
  }

  /**
   * Concatenates the results of another stream into this stream without deduplication
   *
   * @param other Stream to concatenate
   * @returns New stream containing elements from both streams
   */
  public union<U>(other: Stream<U>) {
    return this.stage(Stream<T | U>, QueryStage("union", undefined, other));
  }

  /**
   * Perform a left join operation between this stream (left) and another stream (right)
   *
   * @param right Right stream
   * @param predicate Predicate to match elements from the left stream to the right stream
   * @param mapper Mapping function for each pair of documents
   * @returns New stream with results of the mapping function
   */
  public join<U, V>(
    right: Stream<U>,
    predicate: (
      left: ValueProxy<T>,
      right: ValueProxy<U>,
    ) => ValueProxyOrValue<boolean>,
    mapper: (left: ValueProxy<T>, right: ValueProxy<U | null>) => V,
  ) {
    return this.stage(
      Stream<ExtractType<V>>,
      QueryStage(
        "join",
        { innerOnly: false },
        right,
        this.callfunc(predicate, ValueProxy<T>, ValueProxy<U>),
        this.callfunc(mapper, ValueProxy<T>, ValueProxy<U | null>),
      ),
    );
  }

  /**
   * Perform an inner join operation between this stream (left) and another stream (right)
   *
   * @param right Right stream
   * @param predicate Predicate to match elements from the left stream to the right stream
   * @param mapper Mapping function for each pair of documents
   * @returns New stream with results of the mapping function
   */
  public joinInner<U, V>(
    right: Stream<U>,
    predicate: (
      left: ValueProxy<T>,
      right: ValueProxy<U>,
    ) => ValueProxyOrValue<boolean>,
    mapper: (left: ValueProxy<T>, right: ValueProxy<U>) => V,
  ) {
    return this.stage(
      Stream<ExtractType<V>>,
      QueryStage(
        "join",
        { innerOnly: true },
        right,
        this.callfunc(predicate, ValueProxy<T>, ValueProxy<U>),
        this.callfunc(mapper, ValueProxy<T>, ValueProxy<U>),
      ),
    );
  }

  /**
   * Transform a foreign key or array of foreign keys into a document from another stream
   *
   * @param right Stream containing the other documents
   * @param localKey Key in the local document to search with and replace
   * @param otherKey Key in the other document to match against
   * @returns New stream
   */
  public lookup<U, TK extends keyof T & string>(
    right: Stream<U>,
    localKey: TK,
    otherKey: keyof U & string,
  ) {
    return this.stage(
      Stream<Omit<T, TK> & Record<TK, T[TK] extends any[] ? U[] : U>>,
      QueryStage("lookup", { localKey, otherKey }, right),
    );
  }

  /**
   * Group the documents using the given index and maps the result using a mapping function
   *
   * The parameters of this function are:
   * - The stream with all the documents inside the group
   * - The index value for this group
   *
   * The result of this function is used as the element in the new stream
   *
   * @param index Index to group on
   * @param mapper Mapping function
   * @returns New stream of grouped data
   */
  public group<U, K extends (keyof T & string) | string>(
    index: K,
    mapper: (
      stream: Stream<T>,
      group: ValueProxy<K extends keyof T ? T[K] : unknown>,
    ) => U,
  ) {
    return this.stage(
      Stream<ExtractType<U>>,
      QueryStage(
        "group",
        { index },
        this.callfunc(mapper, Stream<T>, ValueProxy<unknown>),
      ),
    );
  }

  /**
   * Sort the stream using the given index and direction
   *
   * @param index Index to sort
   * @param direction Sort direction
   * @returns New (sorted) stream
   */
  public orderBy(index: string, direction?: "asc" | "desc") {
    return this.stage(undefined, QueryStage("orderBy", { index, direction }));
  }

  /**
   * Obtain a slice (subsection) of the stream
   *
   * @param offset Offset into the stream
   * @param count Number of documents to pick
   * @returns New stream
   */
  public slice(offset: Value<number>, count?: Value<number>) {
    return this.stage(undefined, QueryStage("slice", undefined, offset, count));
  }

  /**
   * Obtain the Nth document of the stream
   *
   * @param n N
   * @returns Single document
   */
  public nth(n: Value<number>) {
    return this.stage(Datum<T | null>, QueryStage("nth", undefined, n));
  }

  /**
   * Gets the count of documents or the count of distinct values of a given field
   *
   * @param field Field to count distinct entries
   * @returns Count
   */
  public count(field?: keyof T & string) {
    return this.stage(Datum<number>, QueryStage("count", { field }));
  }

  /**
   * Sum of the values on the given field
   *
   * @param field Field to use
   * @returns Sum
   */
  public sum(field?: keyof T & string) {
    return this.stage(Datum<number>, QueryStage("sum", { field }));
  }

  /**
   * Average of the values on the given field
   *
   * @param field Field to use
   * @returns Average
   */
  public avg(field?: keyof T & string) {
    return this.stage(Datum<number>, QueryStage("avg", { field }));
  }

  /**
   * Minimum of the values on the given field
   *
   * @param field Field to use
   * @returns Minimum value
   */
  public min(field?: keyof T & string) {
    return this.stage(Datum<number>, QueryStage("min", { field }));
  }

  /**
   * Maximum of the values on the given field
   *
   * @param field Field to use
   * @returns Maximum value
   */
  public max(field?: keyof T & string) {
    return this.stage(Datum<number>, QueryStage("max", { field }));
  }

  /**
   * Gets an array of distinct documents in the stream
   *
   * @returns Array of documents
   */
  public distinct(): Datum<T[]>;
  public distinct(field: undefined): Datum<T[]>;

  /**
   * Gets a stream of the distinct values of a field
   *
   * @param index Field to use
   * @returns New stream
   */
  public distinct<TK extends keyof T & string>(field: TK): Stream<T[TK]>;
  public distinct(field?: keyof T & string): Datum<T[]> | Stream<T[keyof T]> {
    if (field) {
      return this.stage(Stream<T[keyof T]>, QueryStage("distinct", { field }));
    }
    return this.stage(Datum<T[]>, QueryStage("distinct", { field }));
  }

  /**
   * Turns this stream into a change feed
   *
   * @returns Change feed
   */
  public changes() {
    return this.stage(Query<Changes<T>[]>, QueryStage("changes", undefined));
  }
}

MarkKind(Stream.prototype, STREAM_KIND);

/**
 * Whether a value is a stream, built by any instance of this interface.
 *
 * Unlike `instanceof`, it also recognises objects built by the instance of
 * another provider binding.
 *
 * @param value Value to test
 * @returns True if the value is a stream
 */
export function IsStream(value: unknown): value is Stream<unknown> {
  return isKindHolder(value) && value[STREAM_KIND] === true;
}
