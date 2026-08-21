import { CloseCursor, ReadCursor, RunQuery } from "./query";
import { Schemas } from "./schema";

export const InterfaceDeclarations = {
  CloseCursor,
  ReadCursor,
  RunQuery,
  Schemas,
};

export { Datum } from "./datum";
export { Query } from "./query";
export {
  CROSS_INSTANCE,
  InstanceId,
  Schema,
  SchemaDefinition,
  SchemaInstance,
  Schemas,
} from "./schema";
export { Selection, SingleSelection, Table } from "./selection";
export { Stream } from "./stream";
export { ValueProxy, ValueProxyOrValue } from "./valueproxy";
