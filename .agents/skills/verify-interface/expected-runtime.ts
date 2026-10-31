import type { Printed } from "./scenario-kit.ts";

/** What the packed interface prints for each scenario of scenarios-runtime.ts, reviewed against docs/. */
export const EXPECTED = {
  "atomic-requests": {
    "update": "accepted",
    "remove": "accepted",
    "removeMissingRevision": "accepted",
    "updateMissingRevision": "accepted",
    "deleteIfEqual": "accepted",
    "deleteIfEqualNumber": "accepted",
    "deleteIfEqualDate": "accepted",
    "emptyKey": "TypeError: Atomic mutation requires one literal record identity",
    "notRequest": "TypeError: Atomic mutation requires one literal record identity",
    "classRequest": "TypeError: Atomic mutation requires one literal record identity",
    "unknownType": "TypeError: Unknown atomic mutation operation",
    "dottedField": "TypeError: Atomic mutation fields must be literal field names",
    "operatorField": "TypeError: Atomic mutation fields must be literal field names",
    "identityRevision": "TypeError: Atomic mutation revision cannot be an identity field",
    "emptyExpected": "TypeError: Expected revision must be a token or missing tag",
    "nullExpected": "TypeError: Expected revision must be a token or missing tag",
    "looseMissing": "TypeError: Expected revision must be a token or missing tag",
    "sameRevision": "TypeError: Atomic mutation requires a changed revision token",
    "emptyNext": "TypeError: Atomic mutation requires a changed revision token",
    "patchIdentity": "TypeError: Atomic mutation patch cannot change identity or revision",
    "patchPlainId": "TypeError: Atomic mutation patch cannot change identity or revision",
    "patchRevision": "TypeError: Atomic mutation patch cannot change identity or revision",
    "patchArray": "TypeError: Atomic mutation patch must be an object",
    "patchUndefined": "TypeError: Atomic mutation patches must contain constant data",
    "patchFunction": "TypeError: Atomic mutation patches must contain constant data",
    "patchNaN": "TypeError: Atomic mutation patches must contain constant data",
    "patchInfinity": "TypeError: Atomic mutation patches must contain constant data",
    "patchBadDate": "TypeError: Atomic mutation patches must contain constant data",
    "patchGoodDate": "accepted",
    "patchCycle": "TypeError: Atomic mutation patches must contain constant data",
    "patchHoles": "TypeError: Atomic mutation arrays must not contain holes",
    "patchDottedKey": "TypeError: Atomic mutation fields must be literal field names",
    "patchOperatorKey": "TypeError: Atomic mutation fields must be literal field names",
    "patchNested": "accepted",
    "patchProxy": "TypeError: Atomic mutation patches must contain constant data",
    "equalIdentity": "TypeError: Atomic equality field cannot be an identity field",
    "equalNull": "TypeError: Atomic equality requires a scalar or Date",
    "equalArray": "TypeError: Atomic equality requires a scalar or Date",
    "equalObject": "TypeError: Atomic equality requires a scalar or Date",
    "equalNaN": "TypeError: Atomic mutation patches must contain constant data",
    "equalDotted": "TypeError: Atomic mutation fields must be literal field names",
    "crossInstance": "TypeError: Atomic mutation requires one instance-scoped table",
    "namedInstance": "accepted",
    "stages": [
      "schema{id:\"notes\"}",
      "instance{id:undefined}",
      "table{id:\"notes\"}",
      "atomicMutation<\"n-1\"><{type:\"delete\",revisionField:\"revision\",expectedRevision:\"r1\"}>"
    ],
    "queryKinds": [
      true,
      true,
      true
    ]
  },
  "atomic-execution": {
    "outcomes": {
      "applied": "applied",
      "not-applied": "not-applied",
      "unknown": "unknown"
    },
    "bad": {
      "undefined": "AtomicMutationUnsupportedError: The database adapter does not support atomicMutation",
      "zero": "AtomicMutationUnsupportedError: The database adapter does not support atomicMutation",
      "count": "AtomicMutationUnsupportedError: The database adapter does not support atomicMutation",
      "null": "AtomicMutationUnsupportedError: The database adapter does not support atomicMutation",
      "text": "AtomicMutationUnsupportedError: The database adapter does not support atomicMutation",
      "object": "AtomicMutationUnsupportedError: The database adapter does not support atomicMutation"
    },
    "viaRun": "applied",
    "cursor": "TypeError: Atomic mutations cannot be executed as cursors",
    "iterate": "TypeError: Atomic mutations cannot be executed as cursors",
    "lost": "Error: link lost",
    "callsAfterLoss": 1,
    "canonical": [
      [
        "schema{id:\"notes\"}",
        "instance{id:undefined}",
        "table{id:\"notes\"}",
        "atomicMutation<\"n-1\"><{type:\"delete\",revisionField:\"revision\",expectedRevision:\"r1\"}>"
      ],
      4,
      "atomicMutation",
      true,
      2
    ],
    "unsupported": [
      [
        "AtomicMutationUnsupportedError",
        "The database adapter does not support atomicMutation",
        true
      ]
    ]
  },
  "query-execution": {
    "lazy": 0,
    "viaAwait": [
      {
        "title": "A"
      }
    ],
    "viaRun": [
      {
        "title": "A"
      }
    ],
    "viaThen": [
      {
        "title": "A"
      }
    ],
    "viaThenChain": 1,
    "runs": 7,
    "sameStages": true,
    "rejected": "Error: provider refused",
    "caught": "handled:provider refused",
    "onRejected": "caught:provider refused",
    "methods": [
      "function",
      "function",
      "function"
    ],
    "iterator": "function"
  },
  "query-cursor": {
    "firstLoop": {
      "items": [
        {
          "n": 1
        },
        {
          "n": 2
        }
      ],
      "reads": [
        [
          0,
          []
        ],
        [
          0,
          []
        ],
        [
          0,
          []
        ]
      ]
    },
    "afterBreak": {
      "reads": 4,
      "closes": [
        1
      ]
    },
    "stopped": {
      "first": {
        "done": false,
        "value": "m"
      },
      "returned": {
        "done": true
      },
      "closes": [
        1,
        2
      ]
    },
    "generatorLike": [
      "function",
      "function",
      "function",
      true
    ],
    "thrownResult": {
      "done": true
    },
    "closesAfterThrow": [
      1,
      2,
      3
    ]
  },
  "duplicate-key-error": {
    "shape": [
      "DuplicateKeyError",
      "Duplicate key on index \"email\" (email)",
      "email",
      [
        "email"
      ],
      true,
      true
    ],
    "primary": [
      "_id",
      "Duplicate key on index \"_id\" (_id)"
    ],
    "known": [
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false
    ],
    "markerHidden": 0
  },
  "query-kinds": {
    "table": [
      "table",
      true,
      true,
      false,
      false
    ],
    "filtered": [
      "filtered",
      true,
      true,
      false,
      false
    ],
    "single": [
      "single",
      true,
      false,
      true,
      false
    ],
    "count": [
      "count",
      true,
      false,
      true,
      false
    ],
    "key": [
      "key",
      true,
      true,
      false,
      false
    ],
    "insert": [
      "insert",
      true,
      false,
      false,
      false
    ],
    "atomic": [
      "atomic",
      true,
      false,
      false,
      false
    ],
    "proxy": [
      "proxy",
      false,
      false,
      false,
      true
    ],
    "constant": [
      "constant",
      false,
      false,
      false,
      true
    ],
    "plain": [
      "plain",
      false,
      false,
      false,
      false
    ],
    "nothing": [
      "nothing",
      false,
      false,
      false,
      false
    ],
    "text": [
      "text",
      false,
      false,
      false,
      false
    ],
    "forged": [
      [
        "forgedQuery",
        true,
        false,
        false,
        false
      ],
      [
        "forgedStream",
        false,
        true,
        false,
        false
      ],
      [
        "forgedDatum",
        false,
        false,
        true,
        false
      ],
      [
        "forgedProxy",
        false,
        false,
        false,
        true
      ]
    ],
    "chain": [
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      true,
      false
    ]
  }
} satisfies { [id: string]: Printed };
