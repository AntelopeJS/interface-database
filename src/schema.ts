import { RegisteringProxy } from "@antelopejs/interface-core";

import {
  Schema as StagedSchema,
  type SchemaDefinition,
} from "./staged-query/schema";

/** @internal */
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
