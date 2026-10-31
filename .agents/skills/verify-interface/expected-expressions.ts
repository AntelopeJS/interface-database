import type { Printed } from "./scenario-kit.ts";

/** What the packed interface prints for each scenario of scenarios-expressions.ts, reviewed against docs/. */
export const EXPECTED = {
  "expression-logic": {
    "eq": [
      "arg#0",
      "obj_index<\"status\"><undefined>",
      "eq<\"active\">"
    ],
    "eqProxy": [
      "arg#0",
      "obj_index<\"a\"><undefined>",
      "eq<(arg#0 > obj_index<\"b\"><undefined>)>"
    ],
    "ne": [
      "arg#0",
      "obj_index<\"status\"><undefined>",
      "ne<\"gone\">"
    ],
    "neNull": [
      "arg#0",
      "obj_index<\"status\"><undefined>",
      "ne<null>"
    ],
    "and": [
      "arg#0",
      "obj_index<\"a\"><undefined>",
      "eq<1>",
      "and<(arg#0 > obj_index<\"b\"><undefined> > eq<2>)>"
    ],
    "or": [
      "arg#0",
      "obj_index<\"a\"><undefined>",
      "eq<1>",
      "or<false>"
    ],
    "not": [
      "arg#0",
      "obj_index<\"done\"><undefined>",
      "not"
    ],
    "gt": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "cmp_gt<17>"
    ],
    "ge": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "cmp_ge<18>"
    ],
    "lt": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "cmp_lt<65>"
    ],
    "le": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "cmp_le<64>"
    ],
    "gtProxy": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "cmp_gt<(arg#0 > obj_index<\"age\"><undefined>)>"
    ],
    "defaulted": [
      "arg#0",
      "obj_index<\"nickname\"><undefined>",
      "default<\"none\">"
    ],
    "defaultedKey": [
      "arg#0",
      "obj_index<\"nickname\"><\"none\">"
    ],
    "constant": [
      "constant<\"x\">"
    ],
    "argument": [
      "arg#0"
    ]
  },
  "expression-objects": {
    "key": [
      "arg#0",
      "obj_index<\"name\"><undefined>"
    ],
    "nested": [
      "arg#0",
      "obj_index<\"address\"><undefined>",
      "obj_index<\"city\"><undefined>"
    ],
    "keyDefault": [
      "arg#0",
      "obj_index<\"phone\"><\"N/A\">"
    ],
    "keyByProxy": [
      "arg#0",
      "obj_index<(arg#0 > obj_index<\"field\"><undefined>)><undefined>"
    ],
    "merge": [
      "arg#0",
      "obj_merge<{extra:1}>"
    ],
    "keys": [
      "arg#0",
      "obj_keys"
    ],
    "values": [
      "arg#0",
      "obj_values"
    ],
    "hasfields": [
      "arg#0",
      "obj_has<[\"a\",\"b\"]>"
    ],
    "hasfieldsNone": [
      "arg#0",
      "obj_has<[]>"
    ],
    "cast": [
      "arg#0"
    ]
  },
  "expression-arithmetic": {
    "addNumber": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "add<1>"
    ],
    "addString": [
      "arg#0",
      "obj_index<\"name\"><undefined>",
      "add<\"!\">"
    ],
    "addList": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "add<[\"x\"]>"
    ],
    "addProxy": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "add<(arg#0 > obj_index<\"age\"><undefined>)>"
    ],
    "addNull": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "add<null>"
    ],
    "sub": [
      "arg#0",
      "obj_index<\"age\"><undefined>",
      "sub<1>"
    ],
    "subProxy": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "sub<(arg#0 > obj_index<\"bornAt\"><undefined>)>"
    ],
    "mul": [
      "arg#0",
      "obj_index<\"price\"><undefined>",
      "mul<2>"
    ],
    "div": [
      "arg#0",
      "obj_index<\"price\"><undefined>",
      "div<4>"
    ],
    "mod": [
      "arg#0",
      "obj_index<\"count\"><undefined>",
      "mod<3>"
    ],
    "round": [
      "arg#0",
      "obj_index<\"price\"><undefined>",
      "round"
    ],
    "ceil": [
      "arg#0",
      "obj_index<\"price\"><undefined>",
      "ceil"
    ],
    "floor": [
      "arg#0",
      "obj_index<\"price\"><undefined>",
      "floor"
    ]
  },
  "expression-bits": {
    "band": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_and<6>"
    ],
    "bor": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_or<1>"
    ],
    "bxor": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_xor<3>"
    ],
    "bnot": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_not"
    ],
    "blshift": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_lshift<2>"
    ],
    "brshift": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_rshift<2>"
    ],
    "brshiftSigned": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_rshift{preserveSign:true}<2>"
    ],
    "bandProxy": [
      "arg#0",
      "obj_index<\"flags\"><undefined>",
      "bit_and<(arg#0 > obj_index<\"mask\"><undefined>)>"
    ]
  },
  "expression-text": {
    "split": [
      "arg#0",
      "obj_index<\"path\"><undefined>",
      "str_split{separator:\"/\",maxSplits:undefined}"
    ],
    "splitLimit": [
      "arg#0",
      "obj_index<\"path\"><undefined>",
      "str_split{separator:\"/\",maxSplits:2}"
    ],
    "splitDefault": [
      "arg#0",
      "obj_index<\"path\"><undefined>",
      "str_split{separator:undefined,maxSplits:undefined}"
    ],
    "concat": [
      "arg#0",
      "obj_index<\"first\"><undefined>",
      "str_concat<\" last\">"
    ],
    "upcase": [
      "arg#0",
      "obj_index<\"name\"><undefined>",
      "str_upcase"
    ],
    "downcase": [
      "arg#0",
      "obj_index<\"name\"><undefined>",
      "str_downcase"
    ],
    "strlen": [
      "arg#0",
      "obj_index<\"name\"><undefined>",
      "str_len"
    ],
    "match": [
      "arg#0",
      "obj_index<\"email\"><undefined>",
      "str_match<\"^a.*@\">"
    ]
  },
  "expression-dates": {
    "during": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_during<0><1>"
    ],
    "duringDates": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_during<date:1970-01-01T00:00:00.000Z><date:1970-01-01T00:00:01.000Z>"
    ],
    "year": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_year"
    ],
    "yearZone": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_with_timezone<\"Europe/Paris\">",
      "date_year"
    ],
    "month": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_month"
    ],
    "day": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_day"
    ],
    "dayofweek": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_dow"
    ],
    "dayofyear": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_with_timezone<\"UTC\">",
      "date_doy"
    ],
    "hours": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_hours"
    ],
    "minutes": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_minutes"
    ],
    "seconds": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_with_timezone<\"UTC\">",
      "date_seconds"
    ],
    "timeofday": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_tod"
    ],
    "epoch": [
      "arg#0",
      "obj_index<\"bornAt\"><undefined>",
      "date_epoch"
    ]
  },
  "expression-arrays": {
    "index": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "arr_index<0>"
    ],
    "includes": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "arr_includes<\"x\">"
    ],
    "slice": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "arr_slice<1><3>"
    ],
    "sliceOpen": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "arr_slice<1><undefined>"
    ],
    "map": [
      "arg#0",
      "obj_index<\"scores\"><undefined>",
      "arr_map<{func[#0](arg#0 > add<1>)}>"
    ],
    "filter": [
      "arg#0",
      "obj_index<\"scores\"><undefined>",
      "arr_filter<{func[#0](arg#0 > cmp_gt<10>)}>"
    ],
    "isempty": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "arr_empty"
    ],
    "count": [
      "arg#0",
      "obj_index<\"tags\"><undefined>",
      "arr_count"
    ],
    "sum": [
      "arg#0",
      "obj_index<\"scores\"><undefined>",
      "arr_sum"
    ],
    "avg": [
      "arg#0",
      "obj_index<\"scores\"><undefined>",
      "arr_avg"
    ],
    "min": [
      "arg#0",
      "obj_index<\"scores\"><undefined>",
      "arr_min"
    ],
    "max": [
      "arg#0",
      "obj_index<\"scores\"><undefined>",
      "arr_max"
    ]
  }
} satisfies { [id: string]: Printed };
