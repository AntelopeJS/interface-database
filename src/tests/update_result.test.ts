import { expect } from "chai";
import { Schema, type Query } from "..";
import type { Exact } from "./helpers/same-type";
import { Vehicle } from "./datasets/vehicles";

const schema = new Schema<{ vehicles: Vehicle }>("test-update-result", {
  vehicles: Vehicle,
});
const vehicles = schema.instance("default").table("vehicles");

interface Note {
  _id?: string;
  body?: string;
  stage?: string;
  args?: unknown[];
}

const noteSchema = new Schema<{ notes: Note }>("test-update-document", {
  notes: {
    fields: { body: "string", stage: "string", args: "any" },
    indexes: {},
  },
});
const notes = noteSchema.instance("default").table("notes");

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

  describe("against a database", () => {
    before(async () => {
      await noteSchema.createInstance("default").run();
      await notes.delete().run();
    });

    after(async () => {
      await notes.delete().run();
      await noteSchema.destroyInstance("default").run();
    });

    it("writes a document holding stage func and an args pair as a document", async () => {
      const document = { stage: "func", args: [[1, 2], "x"] };
      const [key] = await notes.insert([{ body: "before" }]).run();

      const modified = await notes.get(key).update(document).run();

      expect(modified).to.equal(1);
      expect(await notes.get(key).run()).to.deep.include(document);
    });

    it("writes the value a function of the row computes", async () => {
      const [key] = await notes.insert([{ body: "draft" }]).run();

      const modified = await notes
        .get(key)
        .update((note) => ({ body: note.key("body").add("-done") }))
        .run();

      expect(modified).to.equal(1);
      expect(await notes.get(key).run()).to.deep.include({
        body: "draft-done",
      });
    });
  });
});
