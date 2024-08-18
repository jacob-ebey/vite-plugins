import { createMiddleware } from "@hattip/adapter-node";
import * as http from "node:http";
import { defineConfig } from "vite";
import ws from "ws";

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
  server: {
    hmr: {
      path: "/__vite_hmr",
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

        const wss = new ws.Server({ noServer: true });

        server.httpServer!.on(
          "upgrade",
          (request: http.IncomingMessage, socket, head) => {
            const url = new URL(request.url ?? "", "http://base.url");
            if (url.pathname === "/__vite_hmr") return;

            const headers = new Headers();
            for (const [key, value] of Object.entries(request.headers)) {
              if (typeof value === "string") {
                headers.append(key, value);
              } else if (Array.isArray(value)) {
                for (const v of value) {
                  headers.append(key, v);
                }
              }
            }

            wss.handleUpgrade(request, socket, head, async (ws: any) => {
              const response =
                await workerDevEnvironment.dispatchMiniflareFetch(
                  new Request(url, {
                    headers,
                    method: request.method,
                  })
                );

              const webSocket = response.webSocket;
              if (!webSocket) {
                socket.destroy();
                return;
              }

              webSocket.accept();
              webSocket.addEventListener("message", (event) => {
                ws.send(event.data);
              });
              ws.on("message", (data: any) => {
                webSocket.send(data);
              });
              ws.on("close", () => {
                webSocket.close();
              });

              webSocket.addEventListener("close", () => {
                socket.destroy();
              });

              wss.emit("connection", ws, request);
            });
          }
        );

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
