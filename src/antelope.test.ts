import { defineConfig } from "@antelopejs/interface-core/config";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

let mongod: MongoMemoryReplSet;

export default defineConfig({
  name: "interface-database-test",
  cacheFolder: ".antelope/cache",
  modules: {
    mongodb: {
      source: {
        type: "local",
        path: "../mongodb",
        installCommand: ["pnpm install", "npx tsc"],
      },
    },
  },
  test: {
    folder: "dist/tests",
    async setup() {
      mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      return {
        modules: {
          mongodb: {
            config: { url: mongod.getUri() },
          },
        },
      };
    },
    async cleanup() {
      await mongod.stop();
    },
  },
});
