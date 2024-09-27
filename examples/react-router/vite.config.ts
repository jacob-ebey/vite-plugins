import { createMiddleware } from "@hattip/adapter-node";
import cloudflare, {
	type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

const entry = "app/entry.worker.ts";

export default defineConfig({
	dev: {
		optimizeDeps: {
			include: [
				"@react-router/cloudflare",
				"react",
				"react/jsx-runtime",
				"react/jsx-dev-runtime",
				"react-dom",
				"react-dom/client",
				"react-dom/server",
				"react-router",
				"react-router/dom",
			],
		},
	},
	resolve: {
		dedupe: [
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/client",
			"react-dom/server",
			"react-router",
			"react-router/dom",
		],
	},
	environments: {
		client: {},
		ssr: {
			build: {
				rollupOptions: {
					input: entry,
				},
			},
		},
	},
	plugins: [
		reactRouter(),
		cloudflare({
			environments: ["ssr"],
		}),
		{
			name: "dev-server",
			async configureServer(server) {
				const workerDevEnvironment = server.environments
					.ssr as CloudflareDevEnvironment;

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
