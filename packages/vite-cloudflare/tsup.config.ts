import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: "esm",
    platform: "node",
    dts: true,
  },
  {
    entry: ["src/lib/durable-object-runner.ts"],
    format: "esm",
    platform: "neutral",
    dts: false,
    clean: false,
    external: ["cloudflare:workers"],
    noExternal: ["vite/module-runner"],
  },
  {
    entry: ["src/lib/worker-script-runner.ts"],
    format: "esm",
    platform: "neutral",
    dts: false,
    clean: false,
    external: ["cloudflare:workers"],
    noExternal: ["vite/module-runner"],
  },
]);
