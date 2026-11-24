import { expect } from "chai";
import * as t from "io-ts";
import { Schema, type Query } from "..";
import type { Exact } from "./helpers/same-type";
import { Vehicle } from "./datasets/vehicles";

type Recording = {
  _id?: string;
  stage: string;
  args: [number[], string];
};

const schema = new Schema<{ vehicles: Vehicle; recordings: Recording }>(
  "test-update-result",
  {
    vehicles: Vehicle,
    recordings: {
      fields: {
        stage: "string",
        args: t.tuple([t.array(t.number), t.string]),
      },
      indexes: {},
    },
  },
);
const vehicles = schema.instance("default").table("vehicles");
const recordings = schema.instance("default").table("recordings");

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

  describe("Writes", () => {
    before(async () => {
      await schema.createInstance("default").run();
    });

    after(async () => {
      await schema.destroyInstance("default").run();
    });

    it("writes a document holding stage func and an args pair as a document", async () => {
      const [id] = await recordings
        .insert({ stage: "map", args: [[0], "y"] })
        .run();
      const written: Recording = { stage: "func", args: [[1, 2], "x"] };

      const modified = await recordings.get(id).update(written).run();

      expect(modified).to.equal(1);
      expect(await recordings.get(id).run()).to.deep.include(written);
    });
  });
});
