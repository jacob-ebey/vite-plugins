import type { IncomingMessage } from "node:http";

import { createMiddleware } from "@hattip/adapter-node";
import cloudflare, {
	type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";
import { defineConfig } from "vite";
import ws from "ws";

const entry = "src/index.ts";

export default defineConfig({
	environments: {
		worker: {
			build: {
				rollupOptions: {
					input: entry,
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
				if (!server.httpServer) {
					throw new Error("Server must have an http server");
				}

				server.httpServer.on(
					"upgrade",
					(request: IncomingMessage, socket, head) => {
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

						wss.handleUpgrade(request, socket, head, async (ws) => {
							const response =
								await workerDevEnvironment.dispatchMiniflareFetch(
									entry,
									new Request(url, {
										headers,
										method: request.method,
									}),
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
							ws.on("message", (data: ArrayBuffer | string) => {
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
					},
				);

				const middleware = createMiddleware(
					(c) => {
						return workerDevEnvironment.dispatchFetch(entry, c.request);
					},
					{ alwaysCallNext: false },
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
