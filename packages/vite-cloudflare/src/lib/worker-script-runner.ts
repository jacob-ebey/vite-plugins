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

        return handler.fetch(request, this.env, {
          waitUntil: this.ctx.waitUntil.bind(this.ctx),
          passThroughOnException() {},
        });
    }
  }
}

export default {
  fetch(request, env, ctx) {
    const durableObject = env.__CLOUDFLARE_WORKER_RUNNER__.get(
      env.__CLOUDFLARE_WORKER_RUNNER__.idFromName("")
    );
    return durableObject.fetch(request);
  },
} satisfies ExportedHandler<RunnerEnv>;
