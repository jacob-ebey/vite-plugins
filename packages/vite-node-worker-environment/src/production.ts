import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as wt from "node:worker_threads";

export function createWorker(filepath: string, options?: wt.WorkerOptions) {
	const env = options?.env ?? {};
	if (typeof env !== "object") {
		throw new TypeError("Expected options.env to be an object.");
	}

	return new wt.Worker(
		fileURLToPath(
			import.meta.resolve(
				"@jacob-ebey/vite-node-worker-environment/worker.production",
			),
		),
		{
			...options,
			env: {
				...env,
				WORKER_ENVIRONMENT: JSON.stringify({
					entry: path.resolve(filepath),
				}),
			},
		},
	);
}
