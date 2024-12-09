import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/client-api.ts",
      "src/index.ts",
      "src/react-manifest.ts",
      "src/references-server.ts",
      "src/server-api.ts",
      "src/worker-development.ts",
      "src/worker-production.ts",
      "src/worker-shared.ts",
    ],
    format: "esm",
    platform: "node",
    dts: true,
  },
]);
