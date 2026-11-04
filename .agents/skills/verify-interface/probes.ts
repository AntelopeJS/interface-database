/** What a TypeScript consumer sees: result types of the documented calls, and the values the builders accept and refuse. */
export const USAGE_TYPES = `
import type * as Common from "$REPO/dist/common";
import type * as QueryApi from "$REPO/dist/query";
interface User { _id: string; name: string; age: number; createdAt: Date; tags: string[]; address: { city: string } }
declare const schema: Api.Schema<{ users: User; orders: { _id: string; total: number } }>;
const users = schema.instance().table("users");
type Await<Q> = Q extends PromiseLike<infer R> ? R : never;
type Instance = ReturnType<typeof schema.instance>;
async function usage() {
  const ids: string[] = await users.insert({ name: "A" }, { conflict: "update" });
  const manyIds: string[] = await users.insert([{ name: "A" }, { name: "B" }]);
  const user: User = await users.get("id");
  const all: User[] = await users;
  const some: User[] = await users.getAll(["a", "b"], "name");
  const range: User[] = await users.between("createdAt", new Date(0), new Date(1));
  const compound: User[] = await users.between("tags", ["a", "b"], ["c", "d"]);
  const total: number = await users.count();
  const names: string[] = await users.key("name");
  const cities: string[] = await users.map((u) => u.key("address").key("city"));
  const sorted: User[] = await users.orderBy("name", "desc").slice(0, 10);
  const first: User | null = await users.orderBy("name").nth(0);
  const updated: number = await users.get("id").update({ age: 1 });
  const computed: number = await users.getAll("a", "name").update((u) => ({ age: u.key("age").add(1) }));
  const replaced: number = await users.get("id").replace({ _id: "id", name: "N" });
  const removed: number = await users.filter((u) => u.key("age").lt(5)).delete();
  const outcome: "applied" | "not-applied" | "unknown" = await users.atomicMutation("id", { type: "delete", revisionField: "name", expectedRevision: "r1" });
  const instanceId: string = await schema.createInstance("tenant");
  const destroyed: void = await schema.destroyInstance("tenant");
  const listed: string[] = await schema.listInstances();
  const feed: Common.Changes<User>[] = await users.changes();
  for await (const each of users) { const typed: User = each; void typed; }
  for await (const change of users.get("id").changes()) { const kind: "added" | "removed" | "modified" = change.changeType; void kind; }
  void [ids, manyIds, user, all, some, range, compound, total, names, cities, sorted, first, updated, computed, replaced, removed, outcome, instanceId, destroyed, listed, feed];
}
type _ConflictOptions = Assert<Same<Common.InsertOptions["conflict"], "update" | "replace" | undefined>>;
type _Direction = Assert<Same<Parameters<typeof users.orderBy>[1], "asc" | "desc" | undefined>>;
type _TableNames = Assert<Same<Parameters<Instance["table"]>[0], "users" | "orders">>;
type _NoOtherTable = Assert<Not<Accepts<Parameters<Instance["table"]>[0], "nope">>>;
type _Instances = Assert<Same<Parameters<typeof schema.instance>[0], string | typeof Api.CROSS_INSTANCE | undefined>>;
type _Outcome = Assert<Same<Api.AtomicMutationOutcome, "applied" | "not-applied" | "unknown">>;
type _Mutation = Assert<Same<Api.AtomicMutation<User>["type"], "update" | "delete" | "deleteIfEqual">>;
type _MissingTag = Assert<Same<Api.MissingRevision, { kind: "missing" }>>;
type _ChangeKinds = Assert<Same<Common.Changes<User>["changeType"], "added" | "removed" | "modified">>;
type _DeepPartial = Assert<Accepts<Common.DeepPartial<User>, { address: {} }>>;
type _KeysOne = Assert<Accepts<Parameters<typeof users.getAll>[0], "a">>;
type _KeysMany = Assert<Accepts<Parameters<typeof users.getAll>[0], string[]>>;
type _KeysCompound = Assert<Accepts<Parameters<typeof users.getAll>[0], [string, number][]>>;
type _NoObjectKey = Assert<Not<Accepts<Parameters<typeof users.getAll>[0], { id: 1 }>>>;
type _BoundDate = Assert<Accepts<Common.IndexBound, Date>>;
type _BoundNull = Assert<Accepts<Common.IndexBound, null>>;
type _BoundList = Assert<Accepts<Common.IndexBound, (string | number | Date | null)[]>>;
type _NoBoundObject = Assert<Not<Accepts<Common.IndexBound, { a: 1 }>>>;
type _Reads = Assert<Same<Await<ReturnType<typeof users.get>>, User>>;
type _ExecutionMembers = Assert<Same<keyof QueryApi.QueryExecution<number>, "run" | "then" | "cursor" | typeof Symbol.asyncIterator>>;
`;
