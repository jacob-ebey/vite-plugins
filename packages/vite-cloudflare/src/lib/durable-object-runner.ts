/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from "cloudflare:workers";

import type { RunnerEnv } from "./shared.js";
import { CloudflareModuleRunner } from "./cloudflare-runner.js";

declare global {
  var __CLOUDFLARE_ENTRY__: string | undefined;
  var __CLOUDFLARE_DURABLE_CLASS__: string | undefined;
  var __CLOUDFLARE_WORKER_RUNNER__: CloudflareModuleRunner | undefined;
}

let entry: string | undefined = globalThis.__CLOUDFLARE_ENTRY__;
let runner: CloudflareModuleRunner | undefined =
  globalThis.__CLOUDFLARE_WORKER_RUNNER__;
let durableClass: string | undefined = globalThis.__CLOUDFLARE_DURABLE_CLASS__;
let DurableClass: typeof CloudflareDurableObjectRunner | undefined;

async function getLatestClass() {
  if (!entry) {
    throw new Error("Missing entry");
  }
  if (!durableClass) {
    throw new Error("Missing durable object class");
  }
  if (!runner) {
    throw new Error("Missing runner");
  }
  const mod = await runner.import(entry);
  return (DurableClass = mod[durableClass]);
}

export class CloudflareDurableObjectRunner extends DurableObject<RunnerEnv> {
  #DurableClass: typeof CloudflareDurableObjectRunner;
  #instance: CloudflareDurableObjectRunner;

  constructor(ctx: DurableObjectState, env: RunnerEnv) {
    super(ctx, env);
    if (!DurableClass) {
      throw new Error("Durable class not loaded");
    }
    this.#DurableClass = DurableClass;
    this.#instance = new DurableClass(ctx, env);
    const proxyKeys = new Set(
      Object.getOwnPropertyNames(DurableClass.prototype)
    );
    proxyKeys.delete("constructor");

    return new Proxy(this, {
      get: (_, p, reciever) => {
        if (proxyKeys.has(p as string)) {
          return async (...args: any[]) => {
            const instance = await this.#getLatestInstance();
            return (instance as any)[p](...args);
          };
        }
        return undefined;
      },
    });
  }

  async #getLatestInstance() {
    const DurableClass = await getLatestClass();
    if (this.#DurableClass !== DurableClass) {
      this.#DurableClass = DurableClass;
      this.#instance = new DurableClass(this.ctx, this.env);
    }
    return this.#instance;
  }
}

export default {
  async fetch(request, env) {
    if (runner) {
      throw new Error("Runner already initialized");
    }
    const _entry = request.headers.get("x-vite-entry");
    if (!_entry) {
      throw new Error("Missing x-vite-entry header");
    }
    entry = globalThis.__CLOUDFLARE_ENTRY__ = _entry;

    const _durableClass = request.headers.get("x-vite-durable-class");
    if (!_durableClass) {
      throw new Error("Missing x-vite-durable-class header");
    }
    durableClass = globalThis.__CLOUDFLARE_DURABLE_CLASS__ = _durableClass;

    const pair = new WebSocketPair();
    runner = new CloudflareModuleRunner(env, pair[0]);

    await getLatestClass();

    return new Response(null, { status: 101, webSocket: pair[1] });
  },
} satisfies ExportedHandler<RunnerEnv>;
