import { createMiddleware } from "@hattip/adapter-node";
import bridge, {
	type BuildContainer,
} from "@jacob-ebey/vite-bridged-assets-plugin";
import cloudflare, {
	type CloudflareDevEnvironment,
} from "@jacob-ebey/vite-cloudflare-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

declare global {
	var buildContainer: BuildContainer;
}

global.buildContainer = global.buildContainer || {};

const entry = "src/worker.tsx";

export default defineConfig({
	dev: {
		optimizeDeps: {
			include: [
				"react",
				"react-dom",
				"react-dom/server",
				"react/jsx-runtime",
				"react/jsx-dev-runtime",
			],
		},
	},
	environments: {
		client: {
			build: {
				manifest: true,
				outDir: "dist/browser",
				rollupOptions: {
					input: ["src/browser.tsx"],
				},
			},
		},
		worker: {
			build: {
				copyPublicDir: false,
				outDir: "dist/worker",
				rollupOptions: {
					input: entry,
				},
			},
		},
	},
	builder: {
		async buildApp(builder) {
			const browserPromise = builder.build(builder.environments.client);
			buildContainer.browserBuildPromise = browserPromise;
			await Promise.all([
				browserPromise,
				builder.build(builder.environments.worker),
			]);
		},
	},
	plugins: [
		react(),
		bridge({ buildContainer }),
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
