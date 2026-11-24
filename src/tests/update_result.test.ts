import { expect } from "chai";
import { Schema, type Query } from "..";
import type { Exact } from "./helpers/same-type";
import { Vehicle } from "./datasets/vehicles";

const schema = new Schema<{ vehicles: Vehicle }>("test-update-result", {
  vehicles: Vehicle,
});
const vehicles = schema.instance("default").table("vehicles");

describe("Update result", () => {
  it("Resolves an update call to a query of the modified count", () => {
    const viaDocument = vehicles.get("a").update({ price: 1 });
    const viaUpdater = vehicles.get("a").update(() => ({ price: 2 }));
    const document: Exact<typeof viaDocument, Query<number>> = true;
    const updater: Exact<typeof viaUpdater, Query<number>> = true;
    expect(document && updater).to.equal(true);
  });

  it("Resolves the update of a table, read through its type, to the modified count", () => {
    const table: Exact<
      Awaited<ReturnType<ReturnType<typeof vehicles.update>["run"]>>,
      number
    > = true;
    const single: Exact<
      Awaited<
        ReturnType<ReturnType<ReturnType<typeof vehicles.get>["update"]>["run"]>
      >,
      number
    > = true;
    expect(table && single).to.equal(true);
  });
});
