const STORE = `
const store = new db.Schema("store", {
  users: { fields: { name: "string" }, indexes: { role: {}, createdAt: {} } },
  orders: { fields: { amount: "number" }, indexes: { userId: {} } },
});
const users = store.instance().table("users");
const orders = store.instance().table("orders");
const tail = (query) => show(query).slice(3);
`;

/** Stream operations: what map, filter, pluck, order, slice, aggregate and distinct send to the provider. */
export const STREAM_BODIES = {
  "stream-shape": `${STORE}
    return {
      key: tail(users.key("email")),
      keyDefault: tail(users.key("phone", "N/A")),
      defaultAfterKey: tail(users.key("phone").default("N/A")),
      map: tail(users.map((u) => ({ id: u.key("_id"), displayName: u.key("name") }))),
      filter: tail(users.filter((u) => u.key("status").eq("active").and(u.key("age").ge(18)))),
      filterTwice: tail(users.filter((u) => u.key("a").eq(1)).filter((u) => u.key("b").eq(2))),
      pluck: tail(users.pluck("_id", "name")),
      without: tail(users.without("password", "ssn")),
      union: tail(users.filter((u) => u.key("plan").eq("premium")).union(users.filter((u) => u.key("plan").eq("enterprise")))),
      castKeepsStages: tail(users.cast()),
    };
  `,
  "stream-order": `${STORE}
    return {
      orderBy: tail(users.orderBy("name")),
      orderByAsc: tail(users.orderBy("name", "asc")),
      orderByDesc: tail(users.orderBy("createdAt", "desc")),
      slice: tail(users.orderBy("createdAt").slice(0, 10)),
      sliceOffset: tail(users.orderBy("createdAt").slice(10, 10)),
      sliceOpen: tail(users.slice(5)),
      nth: tail(users.orderBy("createdAt").nth(0)),
      sameBase: [tail(users.orderBy("a")).length, tail(users).length],
      chained: tail(users.filter((u) => u.key("a").eq(1)).orderBy("name", "desc").slice(0, 3)),
    };
  `,
  "stream-aggregates": `${STORE}
    return {
      count: tail(users.count()),
      countField: tail(users.count("email")),
      sum: tail(orders.sum("amount")),
      avg: tail(orders.avg("amount")),
      min: tail(orders.min("amount")),
      max: tail(orders.max("amount")),
      distinct: tail(users.distinct()),
      distinctUndefined: tail(users.distinct(undefined)),
      distinctField: tail(users.distinct("role")),
      changes: tail(users.changes()),
    };
  `,
  "stream-run": `${STORE}
    answer = [{ _id: "u1" }, { _id: "u2" }];
    const direct = await users.orderBy("name");
    answer = 7;
    const counted = await users.count();
    return { direct, counted, runs: seen.runs.map((stages) => show(stages).slice(3)) };
  `,
} satisfies { [id: string]: string };

/** Joins, lookups and groups. */
export const JOIN_BODIES = {
  "join-stages": `${STORE}
    return {
      left: tail(users.join(orders, (user, order) => order.key("userId").eq(user.key("_id")), (user, order) => ({ userName: user.key("name"), total: order.key("amount").default(0) }))),
      inner: tail(users.joinInner(orders, (user, order) => order.key("userId").eq(user.key("_id")), (user, order) => ({ userName: user.key("name"), amount: order.key("amount") }))),
      lookup: tail(orders.lookup(users, "userId", "_id")),
      lookupAfterFilter: tail(orders.filter((o) => o.key("amount").gt(5)).lookup(users, "userId", "_id")),
    };
  `,
  "group-stages": `${STORE}
    return {
      group: tail(users.group("role", (stream, role) => ({ role, total: stream.count(), oldest: stream.max("age") }))),
      groupSum: tail(orders.group("userId", (stream, id) => ({ id, spent: stream.sum("amount") }))),
    };
  `,
} satisfies { [id: string]: string };

/** Datum operations: key, default, do, lookup, pluck and cast on one document. */
export const DATUM_BODIES = {
  "datum-stages": `${STORE}
    const one = users.get("user-123");
    const cut = (query) => show(query).slice(3);
    return {
      get: cut(one),
      key: cut(one.key("name")),
      nested: cut(one.key("address").key("city")),
      keyDefault: cut(one.key("phone", "N/A")),
      defaultObject: cut(one.default({ _id: "guest", name: "Guest" })),
      do: cut(one.do((u) => ({ displayName: u.key("name"), contact: u.key("email"), hasPhone: u.key("phone").ne(undefined) }))),
      lookup: cut(orders.get("o-1").lookup(users, "userId", "_id")),
      pluck: cut(one.pluck("name", "email")),
      cast: cut(one.cast()),
      nthOfStream: cut(users.orderBy("createdAt").nth(0)),
    };
  `,
  "datum-run": `${STORE}
    answer = { _id: "user-123", name: "Ada" };
    const doc = await users.get("user-123");
    answer = "Ada";
    const name = await users.get("user-123").key("name");
    answer = null;
    const missing = await users.get("nobody");
    return { doc, name, missing, runs: seen.runs.map((stages) => show(stages).slice(3)) };
  `,
} satisfies { [id: string]: string };
