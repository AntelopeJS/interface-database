import { RegisteringProxy } from "@antelopejs/interface-core";

import { Schema as StagedSchema } from "./staged-query/schema";
import type { SchemaDefinition } from "./staged-query/schema";

//@internal
export const Schemas = new RegisteringProxy<
  (name: string, def: SchemaDefinition) => void
>();

export class Schema<T = any> extends StagedSchema<T, SchemaDefinition> {
  public constructor(id: string, definition: SchemaDefinition) {
    super(id, definition);
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
