import * as path from "node:path";
import { fileURLToPath } from "node:url";

import type { Fetcher } from "@cloudflare/workers-types";
import type {
  MessageEvent,
  ReplaceWorkersTypes,
  WebSocket,
  WorkerOptions,
} from "miniflare";
import {
  Miniflare,
  Request as MiniflareRequest,
  Response as MiniflareResponse,
} from "miniflare";
import * as vite from "vite";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import type { FetchFunctionOptions } from "vite/module-runner";

import { INIT_PATH, UNKNOWN_HOST } from "./shared.js";

export type CloudflareDevApi = {
  dispatchFetch: (entry: string, request: Request) => Promise<Response>;
};

export type CloudlareEnvironmentOptions = {
  outboundService?: (request: Request, mf: Miniflare) => Promise<Response>;
  wranglerConfig: string;
};

export type MinflareContainer = {
  environments: Record<string, CloudflareDevEnvironment>;
  miniflare?: Miniflare;
  miniflareReferences: number;
  webSockets: Map<string, Set<WebSocket>>;
  workers: Map<string, ReplaceWorkersTypes<Fetcher>>;
};

class CloudflareHotChannel implements vite.HotChannel {
  #container: MinflareContainer;
  #listenersMap = new Map<string, Set<Function>>();
  #name: string;

  constructor(name: string, container: MinflareContainer) {
    this.#container = container;
    this.#name = name;
  }

  send(payload: vite.HotPayload): void;
  send<T extends string>(
    event: T,
    payload?: vite.InferCustomEventPayload<T>
  ): void;
  send(...args: unknown[]): void {
    let payload: any;
    if (typeof args[0] === "string") {
      payload = {
        type: "custom",
        event: args[0],
        data: args[1],
      };
    } else {
      payload = args[0];
    }
    payload = JSON.stringify(payload);
    const sockets = this.#container.webSockets.get(this.#name) ?? [];
    for (const socket of sockets) {
      socket.send(payload);
    }
  }

  on<T extends string>(
    event: T,
    listener: (
      data: vite.InferCustomEventPayload<T>,
      client: vite.HotChannelClient,
      ...args: any[]
    ) => void
  ): void;
  on(event: "connection", listener: () => void): void;
  on(event: unknown, listener: unknown): void {
    const listeners = this.#listenersMap.get(event as string) ?? new Set();
    listeners.add(listener as Function);
    this.#listenersMap.set(event as string, listeners);
  }

  off(event: string, listener: Function): void {
    const listeners = this.#listenersMap.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  listen(): void {
    const sockets = this.#container.webSockets.get(this.#name) ?? [];
    for (const socket of sockets) {
      socket.addEventListener("message", this.#onMessage);
    }
  }

  close(): void {
    const sockets = this.#container.webSockets.get(this.#name) ?? [];
    for (const socket of sockets) {
      socket.removeEventListener("message", this.#onMessage);
    }
  }

  #onMessage(event: MessageEvent) {
    let dataString: string;
    if (event.data instanceof ArrayBuffer) {
      dataString = new TextDecoder().decode(event.data);
    } else {
      dataString = event.data;
    }
    const payload = JSON.parse(dataString) as vite.CustomPayload;
    const listeners = this.#listenersMap.get(payload.event) ?? [];
    for (const listener of listeners) {
      listener(payload.data);
    }
  }
}

export class CloudflareDevEnvironment extends vite.DevEnvironment {
  #container: MinflareContainer;
  #options: CloudlareEnvironmentOptions;

  constructor(
    name: string,
    config: vite.ResolvedConfig,
    options: CloudlareEnvironmentOptions,
    container: MinflareContainer
  ) {
    container.miniflareReferences++;

    super(name, config, {
      hot: new CloudflareHotChannel(name, container),
    });

    this.#container = container;
    this.#options = options;
  }

  override async init(): Promise<void> {
    await super.init();

    const durableObjectRunnerPath = fileURLToPath(
      await import.meta.resolve("./durable-object-runner.js")
    );
    const scriptRunnerPath = fileURLToPath(
      await import.meta.resolve("./worker-script-runner.js")
    );

    if (!this.#container.miniflare) {
      const { wranglerConfig } = this.#options;
      const miniflareOptions = unstable_getMiniflareWorkerOptions(
        wranglerConfig,
        this.config.mode
      );

      const { ratelimits, ...sharedWorkerOptions } =
        miniflareOptions.workerOptions;

      const environments =
        this.config.plugins.find((plugin) => plugin.name === "cloudflare")?.api
          ?.environments ?? [];
      if (environments.length === 0) {
        throw new Error("No Cloudflare environments specified");
      }

      const durableObjects: typeof sharedWorkerOptions.durableObjects = {};
      const durableObjectWorkers: WorkerOptions[] = [];
      const durableObjectWorkersInit: Record<
        string,
        { className: string; environment: string }
      > = {};

      for (const [name, definition] of Object.entries(
        sharedWorkerOptions.durableObjects ?? {}
      )) {
        if (typeof definition === "string" || !definition.scriptName) {
          durableObjects[name] = definition;
        } else {
          const environment = definition.scriptName;
          const scriptName = `__VITE_DURABLE_OBJECT__${name}__${definition.className}`;

          let input =
            this.config.environments[environment]?.build.rollupOptions.input;
          if (typeof input !== "string") {
            throw new Error(
              `Environment ${environment} must have a single string input`
            );
          }

          durableObjectWorkersInit[scriptName] = {
            className: definition.className,
            environment,
          };
          durableObjects[name] = {
            className: "CloudflareDurableObjectRunner",
            scriptName,
          };
          durableObjectWorkers.push({
            ...sharedWorkerOptions,
            modulesRoot: "/",
            name: scriptName,
            unsafeEvalBinding: "__VITE_UNSAFE_EVAL__",
            bindings: {
              ...sharedWorkerOptions.bindings,
              __VITE_ROOT__: this.config.root,
            },
            modules: [
              {
                type: "ESModule",
                path: durableObjectRunnerPath,
              },
            ],
            durableObjects: {
              [name]: "CloudflareDurableObjectRunner",
            },
            serviceBindings: {
              ...sharedWorkerOptions.serviceBindings,
              __VITE_FETCH_MODULE__: async (request) => {
                const args = (await request.json()) as [
                  string,
                  string,
                  FetchFunctionOptions
                ];
                try {
                  const result = await this.#container.environments[
                    environment
                  ].fetchModule(...args);
                  return new MiniflareResponse(JSON.stringify(result));
                } catch (error) {
                  return new MiniflareResponse(
                    JSON.stringify({
                      externalize: args[0],
                      type: "builtin",
                    } satisfies vite.FetchResult)
                  );
                }
              },
            },
          });
        }
      }

      for (const worker of durableObjectWorkers) {
        worker.durableObjects = {
          ...durableObjects,
          ...worker.durableObjects,
        };
      }

      const workers: WorkerOptions[] = [];
      for (const environment of environments) {
        let input =
          this.config.environments[environment]?.build.rollupOptions.input;
        if (typeof input !== "string") {
          throw new Error(
            `Environment ${environment} must have a single string input`
          );
        }

        workers.push({
          ...sharedWorkerOptions,
          modulesRoot: "/",
          name: environment,
          unsafeEvalBinding: "__VITE_UNSAFE_EVAL__",
          bindings: {
            ...sharedWorkerOptions.bindings,
            __VITE_ROOT__: this.config.root,
          },
          modules: [
            {
              type: "ESModule",
              path: scriptRunnerPath,
            },
          ],
          durableObjects: {
            ...durableObjects,
            [`__CLOUDFLARE_WORKER_RUNNER__`]: "CloudflareWorkerRunner",
          },
          outboundService: this.#options.outboundService,
          serviceBindings: {
            ...sharedWorkerOptions.serviceBindings,
            __VITE_FETCH_MODULE__: async (request) => {
              const args = (await request.json()) as [
                string,
                string,
                FetchFunctionOptions
              ];
              try {
                const result = await this.#container.environments[
                  environment
                ].fetchModule(...args);
                return new MiniflareResponse(JSON.stringify(result));
              } catch (error) {
                return new MiniflareResponse(
                  JSON.stringify({
                    externalize: args[0],
                    type: "builtin",
                  } satisfies vite.FetchResult)
                );
              }
            },
          },
        });
      }

      const persistPath = path.resolve(
        this.config.root,
        ".wrangler",
        "state",
        "v3"
      );

      this.#container.miniflare = new Miniflare({
        d1Persist: path.join(persistPath, "d1"),
        kvPersist: path.join(persistPath, "kv"),
        r2Persist: path.join(persistPath, "r2"),
        cachePersist: path.join(persistPath, "cache"),
        durableObjectsPersist: path.join(persistPath, "do"),
        workers: [...durableObjectWorkers, ...workers],
      });

      for (const environment of environments) {
        const worker = await this.#container.miniflare.getWorker(environment);
        const initResponse = await worker.fetch(
          new URL(INIT_PATH, UNKNOWN_HOST).href,
          {
            headers: {
              Upgrade: "websocket",
              "x-vite-entry": this.config.environments[environment].build
                .rollupOptions.input as string,
            },
          }
        );
        const webSocket = initResponse.webSocket;
        if (!webSocket) {
          throw new Error(
            `Failed to establish WebSocket connection to environment ${environment}`
          );
        }
        const webSockets =
          this.#container.webSockets.get(environment) ?? new Set();
        webSockets.add(webSocket);
        webSocket.addEventListener("close", () => {
          webSockets.delete(webSocket);
        });

        this.#container.workers.set(
          environment,
          worker as unknown as ReplaceWorkersTypes<Fetcher>
        );
      }

      for (const [name, { className, environment }] of Object.entries(
        durableObjectWorkersInit
      )) {
        const worker = await this.#container.miniflare.getWorker(name);
        const initResponse = await worker.fetch(
          new URL(INIT_PATH, UNKNOWN_HOST).href,
          {
            headers: {
              Upgrade: "websocket",
              "x-vite-entry": this.config.environments[environment].build
                .rollupOptions.input as string,
              "x-vite-durable-class": className,
            },
          }
        );

        const webSocket = initResponse.webSocket;
        if (!webSocket) {
          throw new Error(
            `Failed to establish WebSocket connection to environment ${environment}`
          );
        }
        const webSockets =
          this.#container.webSockets.get(environment) ?? new Set();
        webSockets.add(webSocket);
        webSocket.addEventListener("close", () => {
          webSockets.delete(webSocket);
        });
      }
    }
  }

  override async close(): Promise<void> {
    this.#container.miniflareReferences--;
    await super.close();

    if (this.#container.miniflareReferences === 0) {
      await this.#container.miniflare?.dispose();
      this.#container.miniflare = undefined;
    }
  }

  async dispatchFetch(request: Request) {
    const durableObject = this.#container.workers.get(this.name);
    if (!durableObject) {
      throw new Error(`Durable object not found for environment ${this.name}`);
    }

    const res = await durableObject.fetch(
      new MiniflareRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body as any,
        redirect: "manual",
        duplex: "half",
      }) as any
    );

    return new Response(res.body as any, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers as any,
    });
  }

  async dispatchMiniflareFetch(request: Request) {
    const durableObject = this.#container.workers.get(this.name);
    if (!durableObject) {
      throw new Error(`Durable object not found for environment ${this.name}`);
    }

    return durableObject.fetch(
      new MiniflareRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body as any,
        redirect: "manual",
        duplex: "half",
      }) as any
    ) as unknown as Promise<MiniflareResponse>;
  }
}

export function createCloudflareEnvironment(
  name: string,
  config: vite.ResolvedConfig,
  options: CloudlareEnvironmentOptions,
  container: MinflareContainer
) {
  const environment = new CloudflareDevEnvironment(
    name,
    config,
    options,
    container
  );

  container.environments[name] = environment;

  return environment;
}

function getDatabaseInfoFromConfig(config: any, name: string) {
  for (const d1Database of config.d1_databases) {
    if (
      d1Database.database_id &&
      (name === d1Database.database_name || name === d1Database.binding)
    ) {
      return {
        uuid: d1Database.database_id,
        previewDatabaseUuid: d1Database.preview_database_id,
        binding: d1Database.binding,
        name: d1Database.database_name,
        migrationsTableName: d1Database.migrations_table || "d1_migrations",
        migrationsFolderPath: d1Database.migrations_dir || "./migrations",
        internal_env: d1Database.database_internal_env,
      };
    }
  }
  return null;
}
