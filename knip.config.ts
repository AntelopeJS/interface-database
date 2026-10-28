import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

/**
 * `ajs module test` runs these compiled suites and builds its test project from
 * `src/antelope.test.ts`. The whole compiled tree ships in the package, and the
 * modules implementing this interface run it as their conformance suite.
 */
const conformanceSuites = ["src/tests/**/*.test.ts", "src/antelope.test.ts"];

/**
 * No import Knip can follow reaches these files: `datasets/index.ts` is the
 * barrel a suite can pull the whole set from, and `datasets/codec_fields.ts`
 * only has to keep type-checking.
 */
const fixtures = ["src/tests/datasets/**/*.ts"];

export default antelopeKnipConfig({
  entry: [...conformanceSuites, ...fixtures],
});
