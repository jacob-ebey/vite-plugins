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
  DurableClass = mod[durableClass];

  return DurableClass;
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
      get: (_, prop, reciever) => {
        const key = prop as keyof CloudflareDurableObjectRunner;
        if (proxyKeys.has(key) && typeof this.#instance[key] === "function") {
          return async (...args: unknown[]) => {
            const instance = await this.#getLatestInstance();
            return (instance[key] as Function).call(instance, ...args);
          };
        }
        return this.#instance[key];
      },
    });
  }

  async #getLatestInstance() {
    const DurableClass = await getLatestClass();
    if (!DurableClass) throw new Error("Durable class not loaded");

    if (this.#DurableClass !== DurableClass) {
      this.#DurableClass = DurableClass;
      const newInstance = new DurableClass(this.ctx, this.env);
      for (const p in this.#instance) {
        const key = p as keyof CloudflareDurableObjectRunner;
        if (typeof this.#instance[key] !== "function") {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (newInstance as any)[key] = this.#instance[key];
        }
      }
      this.#instance = newInstance;
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
