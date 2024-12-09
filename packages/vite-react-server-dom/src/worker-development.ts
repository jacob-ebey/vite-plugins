import { parentPort as parentPartFromModule } from "node:worker_threads";

import type * as vite from "vite";
import { ESModulesEvaluator, ModuleRunner } from "vite/module-runner";

import { handleFetch } from "./worker-shared.js";

const options = JSON.parse(process.env.VITE_DEV_ENVIRONMENT || "{}");

if (!options.root) {
  throw new Error("No root specified in worker environment.");
}

function parentPort() {
  if (!parentPartFromModule) {
    throw new Error("Parent port not available in this context.");
  }
  return parentPartFromModule;
}

const onMessageCallbacks = new Set<(data: vite.HotPayload) => void>();

const runner = new ModuleRunner(
  {
    hmr: false,
    root: options.root,
    sourcemapInterceptor: "prepareStackTrace",
    transport: {
      connect(handlers) {
        onMessageCallbacks.add(handlers.onMessage);
      },
      disconnect() {
        onMessageCallbacks.clear();
      },
      send(payload) {
        parentPort().postMessage({
          type: "module-runner",
          payload,
        });
      },
    },
  },
  new ESModulesEvaluator()
);

parentPort().on("message", (message) => {
  switch (message?.type) {
    case "module-runner":
      for (const cb of onMessageCallbacks) {
        cb(message.payload);
      }
      break;
    case "request": {
      handleFetch(message, async (request) => {
        const mod = await runner.import(message.entry);

        const fetchFunction =
          mod.fetch ??
          mod.handleFetch ??
          mod.default?.fetch ??
          mod.default?.handleFetch ??
          mod.default;

        if (typeof fetchFunction !== "function") {
          throw new Error(
            `No fetch handler function found in '${message.entry}'.`
          );
        }

        return fetchFunction(request);
      });
      break;
    }
  }
});
