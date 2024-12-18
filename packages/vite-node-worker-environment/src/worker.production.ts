import { parentPort as parentPartFromModule } from "node:worker_threads";

import { handleFetch } from "./utils.js";

const options = JSON.parse(process.env.WORKER_ENVIRONMENT || "{}");

if (!options.entry) {
	throw new Error("No entry specified in worker environment.");
}

function parentPort() {
	if (!parentPartFromModule) {
		throw new Error("Parent port not available in this context.");
	}
	return parentPartFromModule;
}

const mod = await import(options.entry);
const fetchFunction =
	mod.fetch ??
	mod.handleFetch ??
	mod.default?.fetch ??
	mod.default?.handleFetch ??
	mod.default;

if (typeof fetchFunction !== "function") {
	throw new Error(`No fetch handler function found in '${options.entry}'.`);
}

parentPort().on("message", (message) => {
	switch (message?.type) {
		case "request": {
			handleFetch(message, fetchFunction);
			break;
		}
	}
});
