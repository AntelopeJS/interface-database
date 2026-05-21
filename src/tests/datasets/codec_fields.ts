import * as t from "io-ts";
import type { SchemaDefinition } from "../../schema";

export const definition: SchemaDefinition = {
  orders: {
    fields: {
      id: "string",
      status: t.union([t.literal("open"), t.literal("closed")]),
      meta: t.type({ source: t.string, retries: t.number }),
      tags: "string[]",
    },
    indexes: {
      status: {},
    },
  },
};
