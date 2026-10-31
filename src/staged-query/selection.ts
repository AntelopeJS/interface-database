import { Datum } from "./datum";
import { Query } from "./query";
import { Stream } from "./stream";
import { ValueProxy, type ValueProxyOrValue } from "./valueproxy";
import {
  QueryStage,
  type Changes,
  type DeepPartial,
  type ExtractType,
  type IndexBound,
  type IndexKeys,
  type InsertOptions,
} from "./common";
import {
  AtomicMutationQuery,
  ValidateAtomicMutation,
  ValidateAtomicMutationTable,
  type AtomicMutation,
  type AtomicMutationOutcome,
} from "./atomic";

type Updater<T, U> = (val: ValueProxy<T>) => U;

function isUpdater<T, U>(
  document: (DeepPartial<T> & object) | Updater<T, U>,
): document is Updater<T, U> {
  return typeof document === "function";
}

/**
 * Selection containing a single element
 */
export class SingleSelection<T> extends Datum<T> {
  /**
   * Update fields of this selection with the given values
   *
   * @param document Partial document with new values
   * @returns Number of modified documents
   */
  public update(document: DeepPartial<T> & object): Query<number>;
  public update<U>(
    document: (val: ValueProxy<T>) => U,
  ): ExtractType<U> extends DeepPartial<T> ? Query<number> : never;
  public update<U>(
    document: (DeepPartial<T> & object) | ((val: ValueProxy<T>) => U),
  ) {
    if (isUpdater(document)) {
      return this.stage(
        Query<number>,
        QueryStage("update", undefined, this.callfunc(document, ValueProxy<T>)),
      );
    }
    return this.stage(Query<number>, QueryStage("update", undefined, document));
  }

  /**
   * Replace documents of this selection
   *
   * @param document Partial document to replace with
   * @returns Number of modified documents
   */
  public replace(document: DeepPartial<T> & object) {
    return this.stage(
      Query<number>,
      QueryStage("replace", undefined, document),
    );
  }

  /**
   * Delete selected documents
   *
   * @returns Number of deleted documents
   */
  public delete() {
    return this.stage(Query<number>, QueryStage("delete", undefined));
  }

  /**
   * Turns this selection into a change feed
   *
   * @returns Change feed
   */
  public changes() {
    return this.stage(Query<Changes<T>[]>, QueryStage("changes", undefined));
  }
}

/**
 * Selection containing any number of elements
 */
export class Selection<T> extends Stream<T> {
  /**
   * Update fields of this selection with the given values
   *
   * @param document Partial document with new values
   * @returns Number of modified documents
   */
  public update(document: DeepPartial<T> & object): Query<number>;
  public update<U>(
    document: (val: ValueProxy<T>) => U,
  ): ExtractType<U> extends DeepPartial<T> ? Query<number> : never;
  public update<U>(
    document: (DeepPartial<T> & object) | ((val: ValueProxy<T>) => U),
  ) {
    if (isUpdater(document)) {
      return this.stage(
        Query<number>,
        QueryStage("update", undefined, this.callfunc(document, ValueProxy<T>)),
      );
    }
    return this.stage(Query<number>, QueryStage("update", undefined, document));
  }

  /**
   * Replace documents of this selection
   *
   * @param document Partial document to replace with
   * @returns Number of modified documents
   */
  public replace(document: DeepPartial<T> & object) {
    return this.stage(
      Query<number>,
      QueryStage("replace", undefined, document),
    );
  }

  /**
   * Delete selected documents
   *
   * @returns Number of deleted documents
   */
  public delete() {
    return this.stage(Query<number>, QueryStage("delete", undefined));
  }
}

/**
 * Database table
 */
export class Table<T> extends Selection<T> {
  /** Atomically checks one record's revision and patches or deletes it without upsert. */
  public atomicMutation(
    key: string,
    request: AtomicMutation<T>,
  ): Query<AtomicMutationOutcome> {
    ValidateAtomicMutationTable(this.stages);
    ValidateAtomicMutation(key, request);
    return this.stage(
      AtomicMutationQuery,
      QueryStage("atomicMutation", undefined, key, request),
    );
  }

  /**
   * Inserts one or more documents into this table
   *
   * @param obj Document(s) to insert
   * @returns Inserted IDs
   */
  public insert(
    obj: (DeepPartial<T> & object) | (DeepPartial<T> & object)[],
    options?: InsertOptions,
  ) {
    return this.stage(Query<string[]>, QueryStage("insert", options, obj));
  }

  /**
   * Gets a document using its primary key
   *
   * @param key Primary key value
   * @returns Single document selection
   */
  public get(key: ValueProxyOrValue<string>) {
    return this.stage(SingleSelection<T>, QueryStage("get", undefined, key));
  }

  /**
   * Gets multiple documents using a secondary index
   *
   * @param keys Key value(s)
   * @param index Secondary index, will use the primary key if undefined
   * @returns Multiple document selection
   */
  public getAll(keys: IndexKeys, index?: string) {
    return this.stage(Selection<T>, QueryStage("getAll", { index }, keys));
  }

  /**
   * Gets multiple documents using a secondary index and bounding values
   *
   * @param index Secondary index
   * @param low Lowest value of the range
   * @param high Highest value of the range (excluded)
   * @returns Multiple document selection
   */
  public between<TK extends keyof T & string>(
    index: TK,
    low: T[TK] & IndexBound,
    high: T[TK] & IndexBound,
  ) {
    return this.stage(
      Selection<T>,
      QueryStage("between", { index }, low, high),
    );
  }
}
