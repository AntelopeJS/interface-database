import { RegisteringProxy } from "@antelopejs/interface-core";

import {
  Schema as StagedSchema,
  type SchemaDefinition,
} from "./staged-query/schema";

/**
 * Registers each schema a consumer defines with the bound database module.
 *
 * The register handler runs when the schema is defined, and on attach for the
 * schemas defined before it. Its return value is discarded, so it must not
 * throw or return a promise that rejects. A module that refuses a definition
 * keeps the refusal and rejects every query on the schema with its message.
 *
 * @internal
 */
export const Schemas = new RegisteringProxy<
  (name: string, def: SchemaDefinition) => void
>();

export class Schema<T = any> extends StagedSchema<T, SchemaDefinition> {
  private static readonly defined = new Map<string, Schema>();

  /**
   * Lists the schemas this process defined, by ID; a schema defined again under
   * the same ID replaces the earlier one.
   *
   * @returns A read-only view of the defined schemas
   */
  public static list(): ReadonlyMap<string, Schema> {
    return Schema.defined;
  }

  /**
   * Defines a schema with the given ID and registers it with the bound
   * database module.
   *
   * Registration never throws or rejects. When the module refuses the
   * definition, every query on the schema, `createInstance()` included,
   * rejects with the module's message.
   *
   * @param id ID of this schema, changing this will leave previous data inaccessible
   * @param definition Schema definition (tables, fields, indexes..)
   */
  public constructor(id: string, definition: SchemaDefinition) {
    super(id, definition);
    Schema.defined.set(id, this);
    Schemas.register(id, definition);
  }
}

export {
  CROSS_INSTANCE,
  type FieldType,
  type IndexDefinition,
  type InstanceId,
  type SchemaDefinition,
  SchemaInstance,
  type StringFieldType,
  type TableDefinition,
} from "./staged-query/schema";
