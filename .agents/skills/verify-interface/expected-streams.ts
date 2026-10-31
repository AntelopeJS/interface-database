import type { Printed } from "./scenario-kit.ts";

/** What the packed interface prints for each scenario of scenarios-streams.ts, reviewed against docs/. */
export const EXPECTED = {
  "stream-shape": {
    "key": [
      "key<\"email\"><undefined>"
    ],
    "keyDefault": [
      "key<\"phone\"><\"N/A\">"
    ],
    "defaultAfterKey": [
      "key<\"phone\"><undefined>",
      "default<\"N/A\">"
    ],
    "map": [
      "map<{func[#0]{id:(arg#0 > obj_index<\"_id\"><undefined>),displayName:(arg#0 > obj_index<\"name\"><undefined>)}}>"
    ],
    "filter": [
      "filter<{func[#0](arg#0 > obj_index<\"status\"><undefined> > eq<\"active\"> > and<(arg#0 > obj_index<\"age\"><undefined> > cmp_ge<18>)>)}>"
    ],
    "filterTwice": [
      "filter<{func[#0](arg#0 > obj_index<\"a\"><undefined> > eq<1>)}>",
      "filter<{func[#0](arg#0 > obj_index<\"b\"><undefined> > eq<2>)}>"
    ],
    "pluck": [
      "pluck<[\"_id\",\"name\"]>"
    ],
    "without": [
      "without<[\"password\",\"ssn\"]>"
    ],
    "union": [
      "filter<{func[#0](arg#0 > obj_index<\"plan\"><undefined> > eq<\"premium\">)}>",
      "union<(schema{id:\"store\"} > instance{id:undefined} > table{id:\"users\"} > filter<{func[#0](arg#0 > obj_index<\"plan\"><undefined> > eq<\"enterprise\">)}>)>"
    ],
    "castKeepsStages": []
  },
  "stream-order": {
    "orderBy": [
      "orderBy{index:\"name\",direction:undefined}"
    ],
    "orderByAsc": [
      "orderBy{index:\"name\",direction:\"asc\"}"
    ],
    "orderByDesc": [
      "orderBy{index:\"createdAt\",direction:\"desc\"}"
    ],
    "slice": [
      "orderBy{index:\"createdAt\",direction:undefined}",
      "slice<0><10>"
    ],
    "sliceOffset": [
      "orderBy{index:\"createdAt\",direction:undefined}",
      "slice<10><10>"
    ],
    "sliceOpen": [
      "slice<5><undefined>"
    ],
    "nth": [
      "orderBy{index:\"createdAt\",direction:undefined}",
      "nth<0>"
    ],
    "sameBase": [
      1,
      0
    ],
    "chained": [
      "filter<{func[#0](arg#0 > obj_index<\"a\"><undefined> > eq<1>)}>",
      "orderBy{index:\"name\",direction:\"desc\"}",
      "slice<0><3>"
    ]
  },
  "stream-aggregates": {
    "count": [
      "count{field:undefined}"
    ],
    "countField": [
      "count{field:\"email\"}"
    ],
    "sum": [
      "sum{field:\"amount\"}"
    ],
    "avg": [
      "avg{field:\"amount\"}"
    ],
    "min": [
      "min{field:\"amount\"}"
    ],
    "max": [
      "max{field:\"amount\"}"
    ],
    "distinct": [
      "distinct{field:undefined}"
    ],
    "distinctUndefined": [
      "distinct{field:undefined}"
    ],
    "distinctField": [
      "distinct{field:\"role\"}"
    ],
    "changes": [
      "changes"
    ]
  },
  "stream-run": {
    "direct": [
      {
        "_id": "u1"
      },
      {
        "_id": "u2"
      }
    ],
    "counted": 7,
    "runs": [
      [
        "orderBy{index:\"name\",direction:undefined}"
      ],
      [
        "count{field:undefined}"
      ]
    ]
  },
  "join-stages": {
    "left": [
      "join{innerOnly:false}<(schema{id:\"store\"} > instance{id:undefined} > table{id:\"orders\"})><{func[#0,#1](arg#1 > obj_index<\"userId\"><undefined> > eq<(arg#0 > obj_index<\"_id\"><undefined>)>)}><{func[#2,#3]{userName:(arg#2 > obj_index<\"name\"><undefined>),total:(arg#3 > obj_index<\"amount\"><undefined> > default<0>)}}>"
    ],
    "inner": [
      "join{innerOnly:true}<(schema{id:\"store\"} > instance{id:undefined} > table{id:\"orders\"})><{func[#0,#1](arg#1 > obj_index<\"userId\"><undefined> > eq<(arg#0 > obj_index<\"_id\"><undefined>)>)}><{func[#2,#3]{userName:(arg#2 > obj_index<\"name\"><undefined>),amount:(arg#3 > obj_index<\"amount\"><undefined>)}}>"
    ],
    "lookup": [
      "lookup{localKey:\"userId\",otherKey:\"_id\"}<(schema{id:\"store\"} > instance{id:undefined} > table{id:\"users\"})>"
    ],
    "lookupAfterFilter": [
      "filter<{func[#0](arg#0 > obj_index<\"amount\"><undefined> > cmp_gt<5>)}>",
      "lookup{localKey:\"userId\",otherKey:\"_id\"}<(schema{id:\"store\"} > instance{id:undefined} > table{id:\"users\"})>"
    ]
  },
  "group-stages": {
    "group": [
      "group{index:\"role\"}<{func[#0,#1]{role:(arg#1),total:(arg#0 > count{field:undefined}),oldest:(arg#0 > max{field:\"age\"})}}>"
    ],
    "groupSum": [
      "group{index:\"userId\"}<{func[#0,#1]{id:(arg#1),spent:(arg#0 > sum{field:\"amount\"})}}>"
    ]
  },
  "datum-stages": {
    "get": [
      "get<\"user-123\">"
    ],
    "key": [
      "get<\"user-123\">",
      "key<\"name\"><undefined>"
    ],
    "nested": [
      "get<\"user-123\">",
      "key<\"address\"><undefined>",
      "key<\"city\"><undefined>"
    ],
    "keyDefault": [
      "get<\"user-123\">",
      "key<\"phone\"><\"N/A\">"
    ],
    "defaultObject": [
      "get<\"user-123\">",
      "default<{_id:\"guest\",name:\"Guest\"}>"
    ],
    "do": [
      "get<\"user-123\">",
      "map<{func[#0]{displayName:(arg#0 > obj_index<\"name\"><undefined>),contact:(arg#0 > obj_index<\"email\"><undefined>),hasPhone:(arg#0 > obj_index<\"phone\"><undefined> > ne<undefined>)}}>"
    ],
    "lookup": [
      "get<\"o-1\">",
      "lookup{localKey:\"userId\",otherKey:\"_id\"}<(schema{id:\"store\"} > instance{id:undefined} > table{id:\"users\"})>"
    ],
    "pluck": [
      "get<\"user-123\">",
      "pluck<[\"name\",\"email\"]>"
    ],
    "cast": [
      "get<\"user-123\">"
    ],
    "nthOfStream": [
      "orderBy{index:\"createdAt\",direction:undefined}",
      "nth<0>"
    ]
  },
  "datum-run": {
    "doc": {
      "_id": "user-123",
      "name": "Ada"
    },
    "name": "Ada",
    "missing": null,
    "runs": [
      [
        "get<\"user-123\">"
      ],
      [
        "get<\"user-123\">",
        "key<\"name\"><undefined>"
      ],
      [
        "get<\"nobody\">"
      ]
    ]
  }
} satisfies { [id: string]: Printed };
