import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  verbose: true,
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  // Transform node_modules p-queue (ESM) so Jest can run it in CJS tests
  transformIgnorePatterns: ["node_modules/(?!p-queue)"],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: false,
};

export default config;
