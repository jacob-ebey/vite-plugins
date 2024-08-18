import type { FetchResult } from "vite/module-runner";
import { ModuleRunner } from "vite/module-runner";
import type { RunnerEnv } from "./shared.js";
import { UNKNOWN_HOST } from "./shared.js";

export class CloudflareModuleRunner extends ModuleRunner {
  constructor(env: RunnerEnv, webSocket: WebSocket) {
    super(
      {
        root: env.__VITE_ROOT__,
        sourcemapInterceptor: "prepareStackTrace",
        transport: {
          async fetchModule(...args) {
            const response = await env.__VITE_FETCH_MODULE__.fetch(
              new Request(UNKNOWN_HOST, {
                method: "POST",
                body: JSON.stringify(args),
              })
            );
            if (!response.ok) {
              return {
                externalize: args[0],
              } satisfies FetchResult;
            }
            const result = await response.json();
            return result as FetchResult;
          },
        },
        hmr: {
          connection: {
            isReady: () => true,
            onUpdate(callback) {
              webSocket.addEventListener("message", (event) => {
                callback(JSON.parse(event.data));
              });
            },
            send(messages) {
              webSocket.send(JSON.stringify(messages));
            },
          },
        },
      },
      {
        async runInlinedModule(context, transformed, id) {
          const codeDefinition = `'use strict';async (${Object.keys(
            context
          ).join(",")})=>{{`;
          const code = `${codeDefinition}${transformed}\n}}`;
          const fn = env.__VITE_UNSAFE_EVAL__.eval(code, id);
          await fn(...Object.values(context));
          Object.freeze(context.__vite_ssr_exports__);
        },
        async runExternalModule(file) {
          return import(file);
        },
      }
    );
  }
}
