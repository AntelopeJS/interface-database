import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect } from "chai";
import * as declarations from "..";
import * as query from "../query";
import * as schema from "../schema";

const packageRoot = path.resolve(__dirname, "../..");
const declarationKeys = ["CloseCursor", "ReadCursor", "RunQuery", "Schemas"];

function verifyImportOrder(firstEntry: string, secondEntry: string) {
  const source = `
    const assert = require("node:assert/strict");
    const path = require("node:path");
    const packageRoot = ${JSON.stringify(packageRoot)};
    const first = require(path.join(packageRoot, ${JSON.stringify(firstEntry)}));
    const second = require(path.join(packageRoot, ${JSON.stringify(secondEntry)}));
    const root = ${JSON.stringify(firstEntry)} === "dist/index.js" ? first : second;
    const query = require(path.join(packageRoot, "dist/query.js"));
    const schema = require(path.join(packageRoot, "dist/schema.js"));
    assert.deepStrictEqual(Object.keys(root.InterfaceDeclarations).sort(), ${JSON.stringify(declarationKeys.sort())});
    assert.strictEqual(root.InterfaceDeclarations.CloseCursor, query.CloseCursor);
    assert.strictEqual(root.InterfaceDeclarations.ReadCursor, query.ReadCursor);
    assert.strictEqual(root.InterfaceDeclarations.RunQuery, query.RunQuery);
    assert.strictEqual(root.InterfaceDeclarations.Schemas, schema.Schemas);
    assert.strictEqual(root.Schemas, schema.Schemas);
  `;
  execFileSync(process.execPath, ["-e", source]);
}

describe("root interface declarations", () => {
  it("exports every canonical provider declaration", () => {
    expect(
      Object.keys(declarations.InterfaceDeclarations).sort(),
    ).to.deep.equal(declarationKeys.sort());
    expect(declarations.InterfaceDeclarations.CloseCursor).to.equal(
      query.CloseCursor,
    );
    expect(declarations.InterfaceDeclarations.ReadCursor).to.equal(
      query.ReadCursor,
    );
    expect(declarations.InterfaceDeclarations.RunQuery).to.equal(
      query.RunQuery,
    );
    expect(declarations.InterfaceDeclarations.Schemas).to.equal(schema.Schemas);
    expect(declarations.Schemas).to.equal(schema.Schemas);
  });

  it("keeps canonical declarations in both import orders", () => {
    verifyImportOrder("dist/index.js", "dist/schema.js");
    verifyImportOrder("dist/schema.js", "dist/index.js");
    verifyImportOrder("dist/index.js", "dist/query.js");
    verifyImportOrder("dist/query.js", "dist/index.js");
  });
});
