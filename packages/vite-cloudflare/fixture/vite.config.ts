import { createMiddleware } from "@hattip/adapter-node";
import { defineConfig } from "vite";

import cloudflare, {
  type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";

export default defineConfig({
  dev: {
    optimizeDeps: {
      include: ["multi-condition-example"],
    },
  },
  environments: {
    counter: {
      build: {
        outDir: "dist/counter",
        rollupOptions: {
          input: "src/counter.ts",
        },
      },
      resolve: {
        conditions: ["c"],
      },
    },
    workera: {
      build: {
        outDir: "dist/workera",
        rollupOptions: {
          input: "src/workera.ts",
        },
      },
      resolve: {
        conditions: ["a"],
      },
    },
    workerb: {
      build: {
        outDir: "dist/workerb",
        rollupOptions: {
          input: "src/workerb.ts",
        },
      },
      resolve: {
        conditions: ["b"],
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await Promise.all([
        builder.build(builder.environments.workera),
        builder.build(builder.environments.workerb),
      ]);
    },
  },
  plugins: [
    cloudflare({
      environments: ["counter", "workera", "workerb"],
    }),
    {
      name: "dev-server",
      async configureServer(server) {
        const workeraEnvironment = server.environments
          .workera as CloudflareDevEnvironment;
        const workerbEnvironment = server.environments
          .workerb as CloudflareDevEnvironment;

        return () => {
          server.middlewares.use((req, res, next) => {
            req.url = req.originalUrl;
            createMiddleware(
              (c) => {
                const url = new URL(c.request.url);
                if (
                  url.pathname.startsWith("/b") ||
                  url.pathname.startsWith("/b/")
                ) {
                  return workerbEnvironment.dispatchFetch(c.request);
                } else {
                  return workeraEnvironment.dispatchFetch(c.request);
                }
              },
              { alwaysCallNext: false }
            )(req, res, next);
          });
        };
      },
    },
  ],
});
