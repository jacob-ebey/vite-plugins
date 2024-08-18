import { createMiddleware } from "@hattip/adapter-node";
import { defineConfig } from "vite";

import cloudflare, {
  type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";

export default defineConfig({
  environments: {
    worker: {
      build: {
        rollupOptions: {
          input: "src/index.ts",
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.worker);
    },
  },
  plugins: [
    cloudflare({
      environments: ["worker"],
    }),
    {
      name: "dev-server",
      async configureServer(server) {
        const workerDevEnvironment = server.environments
          .worker as CloudflareDevEnvironment;

        return () => {
          server.middlewares.use((req, res, next) => {
            req.url = req.originalUrl;
            createMiddleware(
              (c) => {
                return workerDevEnvironment.dispatchFetch(c.request);
              },
              { alwaysCallNext: false }
            )(req, res, next);
          });
        };
      },
    },
  ],
});
