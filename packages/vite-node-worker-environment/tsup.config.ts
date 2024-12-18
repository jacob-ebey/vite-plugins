import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: [
			"src/index.ts",
			"src/production.ts",
			"src/worker.development.ts",
			"src/worker.production.ts",
		],
		format: "esm",
		platform: "node",
		dts: true,
	},
]);
