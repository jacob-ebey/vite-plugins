import { Response as MiniflareResponse } from "miniflare";
import * as vite from "vite";

import type {
	CloudlareEnvironmentOptions,
	MinflareContainer,
} from "./lib/cloudflare-environment.js";
import { createCloudflareEnvironment } from "./lib/cloudflare-environment.js";

export type { CloudflareDevEnvironment } from "./lib/cloudflare-environment.js";

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
							body: request.body,
							redirect: "manual",
							duplex: request.body ? "half" : undefined,
						} as RequestInit & {
							duplex?: "half";
							// biome-ignore lint/suspicious/noExplicitAny: <explanation>
						}) as any,
						mf,
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
		config(config, { command, mode }) {
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
								createEnvironment:
									command !== "serve" || mode === "production"
										? undefined
										: (name, config) =>
												createCloudflareEnvironment(
													name,
													config,
													{
														outboundService: wrappedOutboundService,
														wranglerConfig,
													},
													container,
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
					]),
				),
			});
		},
	};
}
