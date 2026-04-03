import { Schema, ValueProxy } from "@antelopejs/interface-database";
import { expect } from "chai";
import { getUniqueUsers, User } from "./datasets/users";

const tableName = "test-table";
const schema = new Schema<{ [tableName]: User }>("test-do-operations", {
  [tableName]: User,
});
const table = schema.instance("default").table(tableName);

// Utiliser le dataset unifié
const testData = getUniqueUsers();

let insertedKeys: string[] = [];

describe("Do Operations", () => {
  before(async () => {
    await schema.createInstance("default").run();
  });

  after(async () => {
    await table.delete().run();
    await schema.destroyInstance("default").run();
  });

  it("Insert Test Data", InsertTestData);
  it("Do with Merge Operation", DoWithMergeOperation);
  it("Do with Prepend Operation", DoWithPrependOperation);
  it("Do with Append Operation", DoWithAppendOperation);
  it("Do with Complex Transformation", DoWithComplexTransformation);
  it("Do with Conditional Logic", DoWithConditionalLogic);
  it("Do with Array Operations", DoWithArrayOperations);
  it("Do with Nested Object Operations", DoWithNestedObjectOperations);
  it("Do with Subquery Field Reference", DoWithSubqueryFieldReference);
  it(
    "Do with Unresolved Subquery Returns Null",
    DoWithUnresolvedSubqueryReturnsNull,
  );
  it("Do with No Temporary Lookup Fields", DoWithNoTemporaryLookupFields);
  it("Do with sub()", DoWithSub);
  it("Do with div()", DoWithDiv);
  it("Do with mod()", DoWithMod);
  it("Do with ceil() and floor()", DoWithCeilFloor);
  it("Do with Bitwise Operations", DoWithBitwiseOperations);
  it("Do with Array ValueProxy Operations", DoWithArrayValueProxyOps);
  it("Do with Object keys() and values()", DoWithObjectKeysValues);
  it("Do with Dynamic Key Access", DoWithDynamicKeyAccess);
  it("Cleanup", CleanupTest);
});

async function InsertTestData() {
  const response = await table.insert(testData).run();
  expect(response).to.be.an("array");

  expect(response).to.have.lengthOf(testData.length);
  response.forEach((val) => {
    expect(val).to.be.a("string");
  });
  insertedKeys = response;
}

async function DoWithMergeOperation() {
  const result = await table
    .get(insertedKeys[0])
    .do((order) =>
      order.merge({
        metadata: {
          level: 10,
          tags: ["expert", "architect"],
          preferences: table
            .get(insertedKeys[1])
            .key("metadata")
            .key("preferences"),
        },
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Antoine");
  expect(result).to.have.property("metadata");
  expect(result.metadata).to.have.property("level", 10);
  expect(result.metadata).to.have.property("tags");
  expect(result.metadata.tags).to.include("expert");
  expect(result.metadata.tags).to.include("architect");
  expect(result.metadata).to.have.property("preferences");
  expect(result.metadata.preferences).to.deep.equal({
    theme: "light",
    language: "en",
  });
}

async function DoWithPrependOperation() {
  const result = await table
    .get(insertedKeys[0])
    .do((order) =>
      order.merge({
        skills: table.get(insertedKeys[1]).key("skills"),
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Antoine");
  expect(result).to.have.property("skills");
  expect(result.skills).to.be.an("array");
  const expectedSkillsCount = testData[1].skills?.length || 0;
  expect(result.skills).to.have.lengthOf(expectedSkillsCount);
  expect(result.skills?.[0]).to.equal("Photoshop");
  expect(result.skills?.[1]).to.equal("Illustrator");
  expect(result.skills?.[2]).to.equal("Design");
}

async function DoWithAppendOperation() {
  const result = await table
    .get(insertedKeys[0])
    .do((order) =>
      order.merge({
        scores: table.get(insertedKeys[2]).key("skills"),
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Antoine");
  expect(result).to.have.property("scores");
  expect(result.scores).to.be.an("array");
  const expectedScoresCount = testData[2].skills?.length || 0;
  expect(result.scores).to.have.lengthOf(expectedScoresCount);
  expect(result.scores?.[0]).to.equal("Python");
  expect(result.scores?.[1]).to.equal("Django");
  expect(result.scores?.[2]).to.equal("PostgreSQL");
}

async function DoWithComplexTransformation() {
  const result = await table
    .get(insertedKeys[0])
    .do((order) =>
      order.merge({
        name: "Antoine - Senior",
        age: order.key("age").add(5),
        skills: ["Node.js", "MongoDB"],
        metadata: {
          level: order.key("metadata").key("level").add(2),
          tags: ["fullstack"],
          preferences: order.key("metadata").key("preferences"),
        },
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Antoine - Senior");
  expect(result).to.have.property("age", 30);
  expect(result).to.have.property("skills");
  expect(result.skills).to.include("Node.js");
  expect(result.skills).to.include("MongoDB");
  expect(result.metadata).to.have.property("level", 5);
  expect(result.metadata.tags).to.include("fullstack");
}

async function DoWithConditionalLogic() {
  const result = await table
    .get(insertedKeys[1])
    .do((order) =>
      order.merge({
        status: order.key("isActive").eq(true).default("inactive"),
        experience: order.key("age").gt(25).default("junior"),
        skills: order.key("skills"),
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Alice");
  expect(result).to.have.property("status");
  expect(result.status).to.be.a("boolean");
  expect(result).to.have.property("experience");
  expect(result.experience).to.be.a("boolean");
  expect(result).to.have.property("skills");
  expect(result.skills).to.be.an("array");
  const expectedSkillsCount = testData[1].skills?.length || 0;
  expect(result.skills).to.have.lengthOf(expectedSkillsCount);
}

async function DoWithArrayOperations() {
  const result = await table
    .get(insertedKeys[2])
    .do((order) =>
      order.merge({
        averageScore: order.key("skills").count(),
        maxScore: order.key("skills").count(),
        minScore: order.key("skills").count(),
        totalSkills: order.key("skills").count(),
        skills: order.key("skills"),
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Camille");
  expect(result).to.have.property("averageScore");
  expect(result.averageScore).to.be.a("number");
  const expectedSkillsCount = testData[2].skills?.length || 0;
  expect(result.averageScore).to.equal(expectedSkillsCount);
  expect(result).to.have.property("maxScore", expectedSkillsCount);
  expect(result).to.have.property("minScore", expectedSkillsCount);
  expect(result).to.have.property("totalSkills", expectedSkillsCount);
  expect(result).to.have.property("skills");
  expect(result.skills).to.deep.equal(["Python", "Django", "PostgreSQL"]);
}

async function DoWithNestedObjectOperations() {
  const result = await table
    .get(insertedKeys[3])
    .do((order) =>
      order.merge({
        profile: {
          basic: {
            name: order.key("name"),
            age: order.key("age"),
            isActive: order.key("isActive"),
          },
          skills: order.key("skills"),
          metadata: {
            preferences: ["remote-first"],
            tags: ["experienced"],
            level: order.key("metadata").key("level"),
          },
        },
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Dominique");
  expect(result).to.have.property("profile");
  expect(result.profile).to.have.property("basic");
  expect(result.profile.basic).to.have.property("name", "Dominique");
  expect(result.profile.basic).to.have.property("age", 35);
  expect(result.profile.basic).to.have.property("isActive", true);
  expect(result.profile).to.have.property("skills");
  expect(result.profile.skills).to.deep.equal(["Embedded C", "C++"]);
  expect(result.profile).to.have.property("metadata");
  if (
    typeof result.profile.metadata.preferences === "object" &&
    result.profile.metadata.preferences &&
    "theme" in result.profile.metadata.preferences
  ) {
    expect(result.profile.metadata.preferences.theme).to.equal("dark");
  }
  expect(result.profile.metadata.tags).to.include("experienced");
}

async function DoWithSubqueryFieldReference() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) =>
      doc.merge({
        lookedUpUser: table.getAll(doc.key("email") as any, "email").nth(0),
      }),
    )
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Antoine");
  expect(result).to.have.property("lookedUpUser");
  expect(result.lookedUpUser).to.be.an("object");
  expect(result.lookedUpUser).to.have.property("name", "Antoine");
  expect(result.lookedUpUser).to.have.property("email", "antoine@example.com");
  expect(result.lookedUpUser).to.have.property("age", 25);
}

async function DoWithUnresolvedSubqueryReturnsNull() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      missing: table.get("nonexistent-id-12345"),
    }))
    .run();

  expect(result).to.be.an("object");
  expect(result).to.have.property("name", "Antoine");
  expect(result).to.have.property("missing");
  expect(result.missing).to.equal(null);
}

async function DoWithNoTemporaryLookupFields() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      email: doc.key("email"),
      resolvedUser: table.getAll(doc.key("email") as any, "email").nth(0),
    }))
    .run();

  expect(result).to.be.an("object");
  const keys = Object.keys(result);
  const temporaryKeys = keys.filter(
    (k) => k.startsWith("temporary_") || k.includes("_lookup_"),
  );
  expect(temporaryKeys).to.have.lengthOf(0);
  expect(result).to.have.property("name", "Antoine");
  expect(result).to.have.property("email", "antoine@example.com");
  expect(result).to.have.property("resolvedUser");
  expect(result.resolvedUser).to.be.an("object");
}

async function DoWithSub() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      ageMinus5: doc.key("age").sub(5),
    }))
    .run();
  expect(result.name).to.equal("Antoine");
  expect(result.ageMinus5).to.equal(testData[0].age - 5);
}

async function DoWithDiv() {
  const result = await table
    .get(insertedKeys[3])
    .do((doc) => ({
      name: doc.key("name"),
      monthlySalary: doc.key("salary").div(12),
    }))
    .run();
  expect(result.name).to.equal("Dominique");
  expect(result.monthlySalary).to.equal((testData[3].salary ?? 0) / 12);
}

async function DoWithMod() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      ageMod10: doc.key("age").mod(10),
    }))
    .run();
  expect(result.name).to.equal("Antoine");
  expect(result.ageMod10).to.equal(testData[0].age % 10);
}

async function DoWithCeilFloor() {
  const result = await table
    .get(insertedKeys[3])
    .do((doc) => ({
      name: doc.key("name"),
      salaryDivCeil: doc.key("salary").div(7).ceil(),
      salaryDivFloor: doc.key("salary").div(7).floor(),
    }))
    .run();
  expect(result.name).to.equal("Dominique");
  expect(result.salaryDivCeil).to.equal(
    Math.ceil((testData[3].salary ?? 0) / 7),
  );
  expect(result.salaryDivFloor).to.equal(
    Math.floor((testData[3].salary ?? 0) / 7),
  );
}

async function DoWithBitwiseOperations() {
  const level = testData[0].metadata?.level ?? 0;
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      band: doc.key("metadata").key("level").band(3),
      bor: doc.key("metadata").key("level").bor(8),
      bxor: doc.key("metadata").key("level").bxor(1),
      bnot: doc.key("metadata").key("level").bnot(),
      blshift: doc.key("metadata").key("level").blshift(2),
      brshift: doc.key("metadata").key("level").brshift(1),
    }))
    .run();
  expect(result.name).to.equal("Antoine");
  expect(result.band).to.equal(level & 3);
  expect(result.bor).to.equal(level | 8);
  expect(result.bxor).to.equal(level ^ 1);
  expect(result.bnot).to.equal(~level);
  expect(result.blshift).to.equal(level << 2);
  expect(result.brshift).to.equal(level >> 1);
}

async function DoWithArrayValueProxyOps() {
  const skills = testData[0].skills ?? [];
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      firstSkill: doc.key("skills").index(0),
      sliced: doc.key("skills").slice(0, 2),
      skillCount: doc.key("skills").count(),
    }))
    .run();
  expect(result.name).to.equal("Antoine");
  expect(result.firstSkill).to.equal(skills[0]);
  expect(result.sliced).to.deep.equal(skills.slice(0, 2));
  expect(result.skillCount).to.equal(skills.length);
}

async function DoWithObjectKeysValues() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => ({
      name: doc.key("name"),
      metaKeys: doc.key("metadata").keys(),
      metaValues: doc.key("metadata").values(),
    }))
    .run();
  expect(result.name).to.equal("Antoine");
  expect(result.metaKeys).to.be.an("array");
  expect(result.metaKeys).to.include("level");
  expect(result.metaKeys).to.include("tags");
  expect(result.metaKeys).to.include("preferences");
  expect(result.metaValues).to.be.an("array");
  expect(result.metaValues).to.have.lengthOf(result.metaKeys.length);
}

async function DoWithDynamicKeyAccess() {
  const result = await table
    .get(insertedKeys[0])
    .do((doc) => {
      const prefs = doc.key("metadata").key("preferences");
      return {
        name: doc.key("name"),
        staticTheme: prefs.key("theme"),
        dynamicTheme: prefs.key(
          ValueProxy.constant({ dummy: "theme" as const }).key("dummy"),
        ),
      };
    })
    .run();

  expect(result.name).to.equal("Antoine");
  const expectedTheme = testData[0].metadata?.preferences?.theme;
  expect(result.staticTheme).to.equal(expectedTheme);
  expect(result.dynamicTheme).to.equal(expectedTheme);
}

async function CleanupTest() {
  for (const key of insertedKeys) {
    await table.get(key).delete().run();
  }
}
