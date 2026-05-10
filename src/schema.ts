import { RegisteringProxy } from "@antelopejs/interface-core";
import { QueryStage, StagedObject } from "./common";
import { Table } from "./selection";

/**
 * Secondary table index definition
 */
export interface IndexDefinition {
  /**
   * Fields to use for compound indexes
   */
  fields?: string[];

  /**
   * Whether or not this is a multi index
   */
  multi?: boolean;
}

export type FieldType =
  | string
  | Array<FieldType>
  | { [subfield: string]: FieldType };

/**
 * Schema table definition
 */
export interface TableDefinition {
  /**
   * Field names and their data types
   */
  fields: Record<string, FieldType>;

  /**
   * List of secondary indexes
   */
  indexes: Record<string, IndexDefinition>;

  /**
   * When true, every row in this table carries a `tenant_id` field and
   * queries on the table must be performed via a tenant-bound instance
   * (see `Schema.instance(id)`). Implementations should:
   *
   * - inject the tenant filter on read/update/delete
   * - stamp `tenant_id` on insert
   * - reject queries with no tenant context
   * - skip the filter when the tenant is `CROSS_TENANT` (read/update/delete only)
   */
  tenantScoped?: boolean;
}

/**
 * Table names and their definitions
 */
export interface SchemaDefinition {
  [tableName: string]: TableDefinition;
}

export interface SchemaOptions {
  /**
   * Name of the physical database that backs this schema.
   *
   * Multiple schemas can share the same `physicalStore` to live in the same
   * physical database, enabling native cross-schema joins. Defaults to the
   * schema id when omitted.
   */
  physicalStore?: string;
}

/**
 * Sentinel value used as a tenant identifier to opt into a cross-tenant query
 * on a tenant-scoped table.
 *
 * Implementations should skip the tenant filter when this value is provided
 * on read/update/delete, and reject it on insert (cross-tenant insert is
 * meaningless).
 *
 * Symbols are not JSON-serializable and cannot be forged from network input,
 * which makes this a safe escape hatch for admin/system-level operations.
 *
 * **Implementation contract**:
 * - Compare the tenant id by identity (`id === CROSS_TENANT`), never by any
 *   string check — symbols carry no string representation.
 * - The query stage pipeline carrying `CROSS_TENANT` MUST stay in-process.
 *   Any transport, queue, IPC, or logging layer that round-trips
 *   `QueryStage.options` through `JSON.stringify` will silently drop the
 *   symbol and `id` will become `undefined`, which on a tenant-scoped table
 *   then throws ("tenant required") instead of bypassing the filter. Run the
 *   pipeline against the adapter directly — do not serialize.
 */
export const CROSS_TENANT: unique symbol = Symbol("antelopejs:cross-tenant");

/**
 * Tenant identifier accepted by `Schema.instance()`.
 *
 * See {@link CROSS_TENANT} for the implementation contract around the
 * cross-tenant sentinel — notably that it cannot survive JSON serialization.
 */
export type TenantId = string | typeof CROSS_TENANT;

//@internal
export const Schemas = new RegisteringProxy<
  (name: string, def: SchemaDefinition, options: SchemaOptions) => void
>();

/**
 * A schema determines the structure of a database
 *
 * Each schema can be queried with an optional tenant context via `instance()`.
 * The physical realization is controlled by `SchemaOptions.physicalStore`.
 */
export class Schema<T = any> extends StagedObject {
  private static readonly registry = new Map<string, Schema>();

  /**
   * Retrieves a previously defined schema by its ID
   *
   * @param id Schema ID
   * @returns The schema instance, or undefined if not found
   */
  public static get(id: string): Schema | undefined {
    return Schema.registry.get(id);
  }

  /**
   * Define a new schema with the given ID
   *
   * @param id ID of this schema, changing this will leave previous data inaccessible
   * @param definition Schema definition (tables, fields, indexes..)
   */
  public constructor(
    public readonly id: string,
    public readonly definition: SchemaDefinition,
    public readonly options: SchemaOptions = {},
  ) {
    super(QueryStage("schema", { id }));
    Schemas.register(id, definition, options);
    Schema.registry.set(id, this);
  }

  /**
   * Gets a query context bound to an optional tenant.
   *
   * - `undefined` → no tenant context. Tenant-scoped tables will reject the query.
   * - `string` → tenant id. Tenant-scoped tables filter on it; non-tenant tables ignore it.
   * - `CROSS_TENANT` → admin escape hatch. Tenant-scoped tables skip the filter on
   *   read/update/delete, reject on insert.
   *
   * @param id Tenant identifier or sentinel
   */
  public instance(id?: TenantId) {
    return this.stage(SchemaInstance<T>, "instance", { id });
  }
}

/**
 * Schema instance, could be a database or a filtered portion of one depending on the implementation
 */
export class SchemaInstance<T> extends StagedObject {
  /**
   * Gets a table from the instance
   *
   * @param id Table name
   * @returns Table
   */
  public table<TK extends keyof T>(id: TK) {
    return this.stage(Table<T[TK]>, "table", { id });
  }
}
