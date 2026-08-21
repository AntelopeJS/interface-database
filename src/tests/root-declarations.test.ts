import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect } from "chai";
import * as declarations from "..";
import * as schema from "../schema";

const packageRoot = path.resolve(__dirname, "../..");

function verifyImportOrder(firstEntry: string, secondEntry: string) {
  const source = `
    const assert = require("node:assert/strict");
    const path = require("node:path");
    const packageRoot = ${JSON.stringify(packageRoot)};
    const first = require(path.join(packageRoot, ${JSON.stringify(firstEntry)}));
    const second = require(path.join(packageRoot, ${JSON.stringify(secondEntry)}));
    const root = ${JSON.stringify(firstEntry)} === "dist/index.js" ? first : second;
    const subpath = ${JSON.stringify(firstEntry)} === "dist/schema.js" ? first : second;
    assert.strictEqual(root.Schemas, subpath.Schemas);
  `;
  execFileSync(process.execPath, ["-e", source]);
}

describe("root interface declarations", () => {
  it("exports the canonical schema registry", () => {
    expect(declarations.Schemas).to.equal(schema.Schemas);
  });

  it("keeps canonical declarations in both import orders", () => {
    verifyImportOrder("dist/index.js", "dist/schema.js");
    verifyImportOrder("dist/schema.js", "dist/index.js");
  });
});
