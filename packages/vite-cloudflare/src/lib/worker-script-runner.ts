/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from "cloudflare:workers";

import type { RunnerEnv } from "./shared.js";
import { INIT_PATH } from "./shared.js";
import { CloudflareModuleRunner } from "./cloudflare-runner.js";

export class CloudflareWorkerRunner extends DurableObject<RunnerEnv> {
  #entry: string | undefined;
  #runner: CloudflareModuleRunner | undefined;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case INIT_PATH:
        if (this.#runner) {
          throw new Error("Runner already initialized");
        }
        const entry = request.headers.get("x-vite-entry");
        if (!entry) {
          throw new Error("Missing x-vite-entry header");
        }
        this.#entry = entry;

        const pair = new WebSocketPair();
        this.#runner = new CloudflareModuleRunner(this.env, pair[0]);

        return new Response(null, { status: 101, webSocket: pair[1] });
      default:
        if (!this.#entry || !this.#runner) {
          throw new Error("Runner not initialized");
        }

        const mod = await this.#runner.import(this.#entry);
        const handler = mod.default as ExportedHandler;

        if (!handler.fetch) {
          throw new Error("Missing fetch handler");
        }

        let passThroughOnException = false;
        try {
          return await handler.fetch(request, this.env, {
            waitUntil: this.ctx.waitUntil.bind(this.ctx),
            passThroughOnException() {
              passThroughOnException = true;
            },
          });
        } catch (e) {
          if (e && e instanceof Error) {
            return new Response(e.stack, {
              headers: {
                "x-vite-pass-through-on-exception": passThroughOnException
                  ? "true"
                  : "false",
                "x-vite-error-message": e.message,
              },
            });
          }
          return new Response(null, {
            headers: {
              "x-vite-pass-through-on-exception": passThroughOnException
                ? "true"
                : "false",
              "x-vite-error-message": String(e),
            },
          });
        }
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const durableObject = env.__CLOUDFLARE_WORKER_RUNNER__.get(
      env.__CLOUDFLARE_WORKER_RUNNER__.idFromName("")
    );
    const response = await durableObject.fetch(request);

    const passThroughOnException =
      response.headers.get("x-vite-pass-through-on-exception") === "true";
    const errorMessage = response.headers.get("x-vite-error-message");

    if (passThroughOnException) {
      ctx.passThroughOnException();
    }
    if (errorMessage) {
      const stack = await response.text();
      const error = new Error(errorMessage);
      error.stack = stack;
      throw error;
    }

    return response;
  },
} satisfies ExportedHandler<RunnerEnv>;
