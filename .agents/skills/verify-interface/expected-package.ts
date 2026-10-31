import type { Printed } from "./scenario-kit.ts";

/** What the packed interface prints for the build-only entry point and the exports map. */
export const STAGED: Printed = {
  "isolation": {
    "blocked": [],
    "leaks": [],
    "before": {
      "query": [
        false,
        false,
        false
      ],
      "iterator": false,
      "atomic": false,
      "schemaList": "undefined"
    },
    "atomicKind": [
      true,
      true
    ],
    "hasBuild": "function"
  },
  "names": [
    "AtomicMutationQuery",
    "CROSS_INSTANCE",
    "Datum",
    "IsDatum",
    "IsQuery",
    "IsQueryStage",
    "IsStream",
    "IsValueProxy",
    "Query",
    "QueryStage",
    "Schema",
    "SchemaInstance",
    "Selection",
    "SingleSelection",
    "StagedObject",
    "Stream",
    "Table",
    "ValidateAtomicMutation",
    "ValidateAtomicMutationTable",
    "ValueProxy"
  ],
  "built": "[{\"stage\":\"schema\",\"options\":{\"id\":\"parity\"},\"args\":[]},{\"stage\":\"instance\",\"options\":{\"id\":\"default\"},\"args\":[]},{\"stage\":\"table\",\"options\":{\"id\":\"posts\"},\"args\":[]},{\"stage\":\"filter\",\"args\":[{\"stage\":\"func\",\"args\":[[0],{\"stages\":[{\"stage\":\"arg\",\"args\":[0]},{\"stage\":\"obj_index\",\"args\":[\"author\",null]},{\"stage\":\"eq\",\"args\":[\"Alice\"]}]}]}]},{\"stage\":\"orderBy\",\"options\":{\"index\":\"views\",\"direction\":\"desc\"},\"args\":[]},{\"stage\":\"slice\",\"args\":[0,10]}]",
  "after": {
    "query": [
      true,
      true,
      true
    ],
    "iterator": true,
    "sameClasses": [
      true,
      true,
      true,
      true,
      true
    ]
  }
} satisfies { [id: string]: Printed };

export const SUBPATHS: Printed = {
  "exported": [
    ".",
    "./atomic",
    "./common",
    "./datum",
    "./query",
    "./schema",
    "./selection",
    "./stream",
    "./staged-query",
    "./valueproxy"
  ],
  "typedAsExported": true,
  "files": [
    "dist",
    "docs",
    "skills"
  ],
  "subpaths": {
    ".": [
      "AtomicMutationQuery",
      "AtomicMutationUnsupportedError",
      "CROSS_INSTANCE",
      "Datum",
      "DuplicateKeyError",
      "IsDatum",
      "IsDuplicateKeyError",
      "IsQuery",
      "IsStream",
      "IsValueProxy",
      "Query",
      "Schema",
      "SchemaInstance",
      "Selection",
      "SingleSelection",
      "Stream",
      "Table",
      "ValidateAtomicMutation",
      "ValidateAtomicMutationTable",
      "ValueProxy"
    ],
    "./atomic": [
      "AtomicMutationQuery",
      "AtomicMutationUnsupportedError",
      "ValidateAtomicMutation",
      "ValidateAtomicMutationTable"
    ],
    "./common": [
      "IsQueryStage",
      "QueryStage",
      "StagedObject"
    ],
    "./datum": [
      "Datum",
      "IsDatum"
    ],
    "./query": [
      "CloseCursor",
      "IsQuery",
      "Query",
      "ReadCursor",
      "RunQuery"
    ],
    "./schema": [
      "CROSS_INSTANCE",
      "Schema",
      "SchemaInstance",
      "Schemas"
    ],
    "./selection": [
      "Selection",
      "SingleSelection",
      "Table"
    ],
    "./stream": [
      "IsStream",
      "Stream"
    ],
    "./staged-query": [
      "AtomicMutationQuery",
      "CROSS_INSTANCE",
      "Datum",
      "IsDatum",
      "IsQuery",
      "IsQueryStage",
      "IsStream",
      "IsValueProxy",
      "Query",
      "QueryStage",
      "Schema",
      "SchemaInstance",
      "Selection",
      "SingleSelection",
      "StagedObject",
      "Stream",
      "Table",
      "ValidateAtomicMutation",
      "ValidateAtomicMutationTable",
      "ValueProxy"
    ],
    "./valueproxy": [
      "IsValueProxy",
      "ValueProxy"
    ]
  }
} satisfies { [id: string]: Printed };
