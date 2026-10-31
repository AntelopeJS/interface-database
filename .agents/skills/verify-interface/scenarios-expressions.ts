const ROW = `
const row = db.ValueProxy.arg(0);
const other = db.ValueProxy.arg(1);
const t = (proxy) => show(proxy);
`;

/** ValueProxy comparison, boolean and presence expressions. */
export const COMPARISON_BODIES = {
  "expression-logic": `${ROW}
    return {
      eq: t(row.key("status").eq("active")),
      eqProxy: t(row.key("a").eq(other.key("b"))),
      ne: t(row.key("status").ne("gone")),
      neNull: t(row.key("status").ne(null)),
      and: t(row.key("a").eq(1).and(row.key("b").eq(2))),
      or: t(row.key("a").eq(1).or(false)),
      not: t(row.key("done").not()),
      gt: t(row.key("age").gt(17)),
      ge: t(row.key("age").ge(18)),
      lt: t(row.key("age").lt(65)),
      le: t(row.key("age").le(64)),
      gtProxy: t(row.key("age").gt(other.key("age"))),
      defaulted: t(row.key("nickname").default("none")),
      defaultedKey: t(row.key("nickname", "none")),
      constant: t(db.ValueProxy.constant("x")),
      argument: t(db.ValueProxy.arg(7)),
    };
  `,
  "expression-objects": `${ROW}
    return {
      key: t(row.key("name")),
      nested: t(row.key("address").key("city")),
      keyDefault: t(row.key("phone", "N/A")),
      keyByProxy: t(row.key(other.key("field"))),
      merge: t(row.merge({ extra: 1 })),
      keys: t(row.keys()),
      values: t(row.values()),
      hasfields: t(row.hasfields("a", "b")),
      hasfieldsNone: t(row.hasfields()),
      cast: t(row.cast()),
    };
  `,
} satisfies { [id: string]: string };

/** ValueProxy numeric and bitwise expressions. */
export const ARITHMETIC_BODIES = {
  "expression-arithmetic": `${ROW}
    return {
      addNumber: t(row.key("age").add(1)),
      addString: t(row.key("name").add("!")),
      addList: t(row.key("tags").add(["x"])),
      addProxy: t(row.key("age").add(other.key("age"))),
      addNull: t(row.key("age").add(null)),
      sub: t(row.key("age").sub(1)),
      subProxy: t(row.key("bornAt").sub(other.key("bornAt"))),
      mul: t(row.key("price").mul(2)),
      div: t(row.key("price").div(4)),
      mod: t(row.key("count").mod(3)),
      round: t(row.key("price").round()),
      ceil: t(row.key("price").ceil()),
      floor: t(row.key("price").floor()),
    };
  `,
  "expression-bits": `${ROW}
    return {
      band: t(row.key("flags").band(6)),
      bor: t(row.key("flags").bor(1)),
      bxor: t(row.key("flags").bxor(3)),
      bnot: t(row.key("flags").bnot()),
      blshift: t(row.key("flags").blshift(2)),
      brshift: t(row.key("flags").brshift(2)),
      brshiftSigned: t(row.key("flags").brshiftPreserveSign(2)),
      bandProxy: t(row.key("flags").band(other.key("mask"))),
    };
  `,
} satisfies { [id: string]: string };

/** ValueProxy text, date and array expressions. */
export const TEXT_DATE_ARRAY_BODIES = {
  "expression-text": `${ROW}
    return {
      split: t(row.key("path").split("/")),
      splitLimit: t(row.key("path").split("/", 2)),
      splitDefault: t(row.key("path").split()),
      concat: t(row.key("first").concat(" last")),
      upcase: t(row.key("name").upcase()),
      downcase: t(row.key("name").downcase()),
      strlen: t(row.key("name").strlen()),
      match: t(row.key("email").match("^a.*@")),
    };
  `,
  "expression-dates": `${ROW}
    return {
      during: t(row.key("bornAt").during(0, 1)),
      duringDates: t(row.key("bornAt").during(new Date(0), new Date(1000))),
      year: t(row.key("bornAt").year()),
      yearZone: t(row.key("bornAt").year("Europe/Paris")),
      month: t(row.key("bornAt").month()),
      day: t(row.key("bornAt").day()),
      dayofweek: t(row.key("bornAt").dayofweek()),
      dayofyear: t(row.key("bornAt").dayofyear("UTC")),
      hours: t(row.key("bornAt").hours()),
      minutes: t(row.key("bornAt").minutes()),
      seconds: t(row.key("bornAt").seconds("UTC")),
      timeofday: t(row.key("bornAt").timeofday()),
      epoch: t(row.key("bornAt").epoch()),
    };
  `,
  "expression-arrays": `${ROW}
    return {
      index: t(row.key("tags").index(0)),
      includes: t(row.key("tags").includes("x")),
      slice: t(row.key("tags").slice(1, 3)),
      sliceOpen: t(row.key("tags").slice(1)),
      map: t(row.key("scores").map((score) => score.add(1))),
      filter: t(row.key("scores").filter((score) => score.gt(10))),
      isempty: t(row.key("tags").isempty()),
      count: t(row.key("tags").count()),
      sum: t(row.key("scores").sum()),
      avg: t(row.key("scores").avg()),
      min: t(row.key("scores").min()),
      max: t(row.key("scores").max()),
    };
  `,
} satisfies { [id: string]: string };
