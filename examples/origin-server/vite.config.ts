import { createMiddleware } from "@hattip/adapter-node";
import cloudflare, {
	type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";
import { createServerModuleRunner, defineConfig } from "vite";

const originEntry = "src/server.ts";
const workerEntry = "src/worker.ts";

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
						input: originEntry,
					},
				},
			},
			worker: {
				build: {
					outDir: "dist/worker",
					rollupOptions: {
						input: workerEntry,
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
						const mod = await serverRunner.import(originEntry);
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

					const httpServer = server.httpServer;
					if (!httpServer) {
						throw new Error("Server must have an http server");
					}

					httpServer.once("listening", () => {
						const _address = httpServer.address();
						if (typeof _address === "string") {
							const [host, port] = _address.split(":");
							origin = `http://localhost:${port}`;
						} else if (_address) {
							origin = `http://localhost:${_address.port}`;
						} else {
							throw new Error("Could not determine server address");
						}
					});

					const middleware = createMiddleware(
						(c) => {
							return workerDevEnvironment.dispatchFetch(workerEntry, c.request);
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
	};
});
