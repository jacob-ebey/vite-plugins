# @jacob-ebey/vite-cloudflare-plugin

A vite plugin that enables local development of Cloudflare Workers using Vite.

## Getting started

```bash
pnpm i -D -E @jacob-ebey/vite-cloudflare-plugin @hattip/adapter-node
```

Add the plugin to your `vite.config.ts`:

```ts
import { createMiddleware } from "@hattip/adapter-node";
import cloudflare, {
  type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  environments: {
    // Our worker environment
    worker: {
      build: {
        rollupOptions: {
          // Entry point for our worker
          input: "src/index.ts",
        },
      },
    },
  },
  plugins: [
    cloudflare({
      // Points to the worker environment
      environments: ["worker"],
    }),
    {
      name: "dev-server",
      async configureServer(server) {
        // Get the worker environment
        const workerDevEnvironment = server.environments
          .worker as CloudflareDevEnvironment;

        return () => {
          // Setup our dev server middleware
          server.middlewares.use((req, res, next) => {
            // Make sure the request URL is the original URL, vite changes "/" to "/index.html"
            req.url = req.originalUrl;
            // Adapt the node dev server request to a fetch request using @hattip/adapter-node
            createMiddleware(
              (c) => {
                // Dispatch the fetch request to the worker environment
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
```

## WebSockets

Install the `ws` package and its types:

```bash
pnpm i -D -E ws @types/ws
```

Import the `ws` package in your vite config:

```ts
import ws from "ws";
```

Explicitly define the hmr WebSocket path in your vite config:

```ts
export default defineConfig({
  server: {
    hmr: {
      path: "/__vite_hmr",
    },
  },
  // existing config
});
```

In your dev server below the

```ts
const workerDevEnvironment = server.environments
  .worker as CloudflareDevEnvironment;
```

line, we will add the following code to delegate WebSocket connections to the worker environment:

```ts
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
      const response = await workerDevEnvironment.dispatchMiniflareFetch(
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
```
