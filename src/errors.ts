import { isKindHolder, MarkKind } from "./staged-query/kind";

const DUPLICATE_KEY_KIND = Symbol.for(
  "@antelopejs/interface-database/DuplicateKeyError@1",
);

/**
 * Thrown by a database module when a write is refused because it would give
 * a second row of the instance the key of a unique index: the primary key
 * (`_id`), or a secondary index declared with `unique: true`.
 *
 * Nothing of the refused write is stored for the row that hit the duplicate.
 */
export class DuplicateKeyError extends Error {
  /**
   * @param index The index holding the key: `_id` for the primary key, else
   * the name the schema gives the index
   * @param fields The fields of that index
   */
  public constructor(
    public readonly index: string,
    public readonly fields: string[],
  ) {
    super(`Duplicate key on index "${index}" (${fields.join(", ")})`);
    this.name = "DuplicateKeyError";
  }
}

MarkKind(DuplicateKeyError.prototype, DUPLICATE_KEY_KIND);

/**
 * Whether a value is a {@link DuplicateKeyError}, thrown by any instance of
 * this interface.
 *
 * Unlike `instanceof`, it also recognises the error of a database module
 * bound to another copy of this interface.
 *
 * @param value Value to test
 * @returns True if the value is a duplicate key error
 */
export function IsDuplicateKeyError(
  value: unknown,
): value is DuplicateKeyError {
  return isKindHolder(value) && value[DUPLICATE_KEY_KIND] === true;
}
