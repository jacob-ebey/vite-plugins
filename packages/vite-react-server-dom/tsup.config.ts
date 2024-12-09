import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/references-server.ts",
      "src/worker-development.ts",
      "src/worker-production.ts",
      "src/worker-shared.ts",
    ],
    format: "esm",
    platform: "node",
    dts: true,
  },
]);
