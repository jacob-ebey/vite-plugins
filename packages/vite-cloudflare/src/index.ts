import { Response as MiniflareResponse } from "miniflare";
import * as vite from "vite";

import type { MinflareContainer } from "./lib/vite-environment.js";
import type { CloudlareEnvironmentOptions } from "./lib/vite-environment.js";
import { createCloudflareEnvironment } from "./lib/vite-environment.js";

export type { CloudflareDevEnvironment } from "./lib/vite-environment.js";

export type CloudflarePluginOptions = {
  environments: string[];
  outboundService?: CloudlareEnvironmentOptions["outboundService"];
  wranglerConfig?: string;
};

export default function cloudflare({
  environments,
  outboundService,
  wranglerConfig = "wrangler.toml",
}: CloudflarePluginOptions): vite.PluginOption {
  const container: MinflareContainer = {
    environments: {},
    miniflareReferences: 0,
    webSockets: new Map(),
    workers: new Map(),
  };

  const wrappedOutboundService: CloudlareEnvironmentOptions["outboundService"] =
    outboundService
      ? async (request, mf) => {
          const response = await outboundService(
            new Request(request.url, {
              method: request.method,
              headers: request.headers,
              body: request.body as any,
              redirect: "manual",
              duplex: request.body ? "half" : undefined,
            } as any) as any,
            mf
          );
          return new MiniflareResponse(response.body, {
            status: response.status,
            headers: response.headers,
          }) as unknown as Response;
        }
      : undefined;

  return {
    name: "cloudflare",
    api: {
      environments,
    },
    config(config) {
      return vite.mergeConfig<vite.UserConfig, vite.UserConfig>(config, {
        environments: Object.fromEntries(
          environments.map((environment) => [
            environment,
            {
              build: {
                ssr: true,
                rollupOptions: {
                  external: [
                    "cloudflare:email",
                    "cloudflare:sockets",
                    "cloudflare:workers",
                  ],
                },
              },
              dev: {
                createEnvironment: (name, config) =>
                  createCloudflareEnvironment(
                    name,
                    config,
                    {
                      outboundService: wrappedOutboundService,
                      wranglerConfig,
                    },
                    container
                  ),
              },
              resolve: {
                mainFields: ["module"],
                conditions: ["workerd"],
                externalConditions: ["workerd", "module"],
                noExternal: true,
                external: [
                  "cloudflare:email",
                  "cloudflare:sockets",
                  "cloudflare:workers",
                ],
              },
              webCompatible: true,
            } satisfies NonNullable<vite.UserConfig["environments"]>[string],
          ])
        ),
      });
    },
  };
}
