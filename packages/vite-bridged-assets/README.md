# @jacob-ebey/vite-bridged-assets-plugin

A vite plugin that enables server environments to import asset URLs from the browser environment.

## Getting started

```bash
pnpm i -D -E @jacob-ebey/vite-bridged-assets-plugin
```

Update your `tsconfig.json` to include the types:

```json
{
  "compilerOptions": {
    "types": ["@jacob-ebey/vite-bridged-assets-plugin/types"]
  }
}
```

Add the plugin to your `vite.config.ts`:

```ts
import bridge, { BuildContainer } from "@jacob-ebey/vite-bridged-assets-plugin";
import { defineConfig } from "vite";

// Declare the global build container for the plugin
declare global {
  var buildContainer: BuildContainer;
}
global.buildContainer = global.buildContainer || {};

export default defineConfig({
  environments: {
    client: {
      build: {
        // Enable manifest for the browser environment
        manifest: true,
        outDir: "dist/browser",
        rollupOptions: {
          input: ["src/browser.ts"],
        },
      },
    },
    worker: {
      build: {
        outDir: "dist/worker",
        rollupOptions: {
          input: "src/worker.ts",
        },
      },
    },
  },
  plugins: [bridge({ buildContainer })],
});
```

Now in your `src/worker.ts` in this example, you can import assets from the browser environment:

```tsx
import browserEntry from "bridge:./browser.ts";
// The hashed asset URL: `/assets/browser.12345678.js`
console.log(browserEntry);
```
