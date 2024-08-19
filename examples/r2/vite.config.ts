import { createMiddleware } from "@hattip/adapter-node";
import cloudflare, {
  type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";
import { defineConfig } from "vite";

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

        const middleware = createMiddleware(
          (c) => {
            return workerDevEnvironment.dispatchFetch(c.request);
          },
          { alwaysCallNext: false }
        );

        return () => {
          server.middlewares.use((req, res, next) => {
            req.url = req.originalUrl;
            middleware(req, res, next);
          });
        };
      },
    },
  ],
});
