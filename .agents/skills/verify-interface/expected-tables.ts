import type { Printed } from "./scenario-kit.ts";

/** What the packed interface prints for each scenario of scenarios-tables.ts, reviewed against docs/. */
export const EXPECTED = {
  "schema-registry": {
    "registered": [
      [
        "notes-demo",
        {
          "notes": {
            "fields": {
              "title": "string"
            },
            "indexes": {}
          }
        }
      ]
    ],
    "found": [
      true,
      true
    ],
    "listed": [
      "notes-demo"
    ],
    "replaced": [
      true,
      true,
      2
    ],
    "listedAfter": [
      "notes-demo",
      "other-demo"
    ],
    "identity": [
      "notes-demo",
      true,
      "other-demo"
    ]
  },
  "schema-stages": {
    "defaultInstance": [
      "schema{id:\"tenants\"}",
      "instance{id:undefined}",
      "table{id:\"people\"}"
    ],
    "named": [
      "schema{id:\"tenants\"}",
      "instance{id:\"acme\"}",
      "table{id:\"people\"}"
    ],
    "cross": [
      "schema{id:\"tenants\"}",
      "instance{id:Symbol(@antelopejs/interface-database/CROSS_INSTANCE)}",
      "table{id:\"people\"}"
    ],
    "crossSymbol": [
      true,
      "symbol"
    ],
    "create": [
      "schema{id:\"tenants\"}",
      "createInstance{id:\"acme\"}"
    ],
    "createDefault": [
      "schema{id:\"tenants\"}",
      "createInstance{id:undefined}"
    ],
    "destroy": [
      "schema{id:\"tenants\"}",
      "destroyInstance{id:\"acme\"}"
    ],
    "list": [
      "schema{id:\"tenants\"}",
      "listInstances"
    ]
  },
  "schema-run": {
    "created": "acme",
    "listed": [],
    "runs": [
      [
        "schema{id:\"tutorial\"}",
        "createInstance{id:\"acme\"}"
      ],
      [
        "schema{id:\"tutorial\"}",
        "listInstances"
      ],
      [
        "schema{id:\"tutorial\"}",
        "destroyInstance{id:\"acme\"}"
      ]
    ],
    "lazy": 0
  },
  "table-reads": {
    "whole": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}"
    ],
    "get": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "get<\"product-1\">"
    ],
    "getAllKey": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:undefined}<\"p-1\">"
    ],
    "getAllKeys": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:undefined}<[\"p-1\",\"p-2\"]>"
    ],
    "getAllIndex": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:\"tags\"}<\"shoes\">"
    ],
    "getAllNumber": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:\"price\"}<10>"
    ],
    "getAllCompound": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:\"pair\"}<[[\"a\",1],[\"b\",2]]>"
    ],
    "between": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "between{index:\"price\"}<10><20>"
    ],
    "betweenDates": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "between{index:\"price\"}<date:2024-01-01T00:00:00.000Z><date:2024-02-01T00:00:00.000Z>"
    ],
    "betweenCompound": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "between{index:\"price\"}<[1,\"a\"]><[2,\"b\"]>"
    ],
    "betweenNull": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "between{index:\"price\"}<null><5>"
    ],
    "selectionFromGetAll": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:\"tags\"}<\"x\">",
      "count{field:undefined}"
    ]
  },
  "table-writes": {
    "insertOne": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "insert<{name:\"Boot\",price:80}>"
    ],
    "insertMany": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "insert<[{name:\"A\"},{name:\"B\"}]>"
    ],
    "insertUpdate": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "insert{conflict:\"update\"}<{_id:\"p-1\",name:\"New\"}>"
    ],
    "insertReplace": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "insert{conflict:\"replace\"}<{_id:\"p-1\"}>"
    ],
    "update": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "getAll{index:\"tags\"}<\"shoes\">",
      "update<{price:5}>"
    ],
    "updateComputed": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "get<\"p-1\">",
      "update<{func[#0]{price:(arg#0 > obj_index<\"price\"><undefined> > add<1>)}}>"
    ],
    "replace": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "get<\"p-1\">",
      "replace<{_id:\"p-1\",name:\"R\"}>"
    ],
    "remove": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "get<\"p-1\">",
      "delete"
    ],
    "removeMany": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "filter<{func[#0](arg#0 > obj_index<\"price\"><undefined> > cmp_lt<5>)}>",
      "delete"
    ],
    "changesOne": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "get<\"p-1\">",
      "changes"
    ],
    "changesAll": [
      "schema{id:\"shop\"}",
      "instance{id:undefined}",
      "table{id:\"products\"}",
      "changes"
    ]
  },
  "table-results": {
    "ids": [
      "id-1",
      "id-2"
    ],
    "updated": 3,
    "missing": null,
    "refused": "Error: provider refused",
    "runs": [
      [
        "schema{id:\"shop\"}",
        "instance{id:undefined}",
        "table{id:\"products\"}",
        "insert{conflict:\"update\"}<[{name:\"A\"},{name:\"B\"}]>"
      ],
      [
        "schema{id:\"shop\"}",
        "instance{id:undefined}",
        "table{id:\"products\"}",
        "getAll{index:\"tags\"}<\"shoes\">",
        "update<{price:1}>"
      ],
      [
        "schema{id:\"shop\"}",
        "instance{id:undefined}",
        "table{id:\"products\"}",
        "get<\"nope\">"
      ],
      [
        "schema{id:\"shop\"}",
        "instance{id:undefined}",
        "table{id:\"products\"}",
        "get<\"p-1\">",
        "delete"
      ]
    ]
  }
} satisfies { [id: string]: Printed };
