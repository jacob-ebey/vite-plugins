import * as vite from "vite";

import type { MinflareContainer } from "./lib/vite-environment.js";
import { createCloudflareEnvironment } from "./lib/vite-environment.js";

export type { CloudflareDevEnvironment } from "./lib/vite-environment.js";

export type CloudflarePluginOptions = {
  environments: string[];
  wranglerConfig?: string;
};

export default function cloudflare({
  environments,
  wranglerConfig = "wrangler.toml",
}: CloudflarePluginOptions): vite.PluginOption {
  const container: MinflareContainer = {
    environments: {},
    miniflareReferences: 0,
    webSockets: new Map(),
    workers: new Map(),
  };

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
                    { wranglerConfig },
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
