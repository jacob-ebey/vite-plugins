import { createMiddleware } from "@hattip/adapter-node";
import { createServerModuleRunner, defineConfig } from "vite";

import cloudflare, {
  type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";

export default defineConfig(() => {
  let serverRunner: ReturnType<typeof createServerModuleRunner>;
  let origin: string;

  return {
    environments: {
      server: {
        nodeCompatible: true,
        build: {
          ssr: true,
          outDir: "dist/server",
          rollupOptions: {
            input: "src/server.ts",
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
    builder: {
      async buildApp(builder) {
        await Promise.all([
          builder.build(builder.environments.server),
          builder.build(builder.environments.worker),
        ]);
      },
    },
    server: {
      hmr: {
        path: "/__vite_hmr",
      },
    },
    plugins: [
      cloudflare({
        environments: ["worker"],
        async outboundService(request) {
          const url = new URL(request.url);
          if (url.origin === origin) {
            const mod = await serverRunner.import("src/server.ts");
            return await mod.default.fetch(request);
          }
          return await fetch(request);
        },
      }),
      {
        name: "dev-server",
        async configureServer(server) {
          serverRunner = createServerModuleRunner(server.environments.server);
          const workerDevEnvironment = server.environments
            .worker as CloudflareDevEnvironment;

          server.httpServer!.once("listening", () => {
            const _address = server.httpServer!.address();
            if (typeof _address === "string") {
              const [host, port] = _address.split(":");
              origin = `http://localhost:${port}`;
            } else if (_address) {
              origin = `http://localhost:${_address.port}`;
            } else {
              throw new Error("Could not determine server address");
            }
          });

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
  };
});
