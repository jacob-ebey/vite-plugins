import * as path from "node:path";

import * as vite from "vite";

export type BuildContainer = {
  browserBuildPromise?: Promise<
    | vite.Rollup.RollupOutput
    | vite.Rollup.RollupOutput[]
    | vite.Rollup.RollupWatcher
  >;
};

export type BridgedAssetsPluginOptions = {
  buildContainer: BuildContainer;
};

export default function bridgedAssets({
  buildContainer,
}: BridgedAssetsPluginOptions): vite.PluginOption {
  return {
    name: "bridged-assets",
    async resolveId(id, importer) {
      if (id.startsWith("bridge:")) {
        if (!this.environment?.config.ssr) {
          throw new Error("Cannot bridge assets from a client build.");
        }

        const baseId = id.slice("bridge:".length);
        const postfix = this.environment.config.command !== "build" ? "" : "";
        const resolved = await this.resolve(baseId + postfix, importer, {
          skipSelf: true,
        });
        if (!resolved) {
          throw new Error(`Could not resolve asset: ${baseId}`);
        }

        // The # is to stop vite from trying to transform the asset.
        return `\0bridge:${resolved.id}#`;
      }
    },
    async load(id) {
      if (id.startsWith("\0bridge:") && id.endsWith("#")) {
        if (!this.environment?.config.ssr) {
          throw new Error("Cannot bridge assets from a client build.");
        }
        const baseId = id.slice("\0bridge:".length, -1);
        const relative = path
          .relative(this.environment.config.root, baseId)
          .replace(/\\/g, "/");

        if (this.environment.config.command !== "build") {
          return `export default "/${relative}";`;
        }

        if (!buildContainer.browserBuildPromise) {
          throw new Error("Browser build promise not set.");
        }
        const clientBuildResults =
          (await buildContainer.browserBuildPromise) as vite.Rollup.RollupOutput;
        const clientBuild = clientBuildResults;

        const manifest = clientBuild.output.find(
          (o) => o.fileName === ".vite/manifest.json"
        );
        if (
          !manifest ||
          !("source" in manifest) ||
          typeof manifest.source !== "string"
        ) {
          throw new Error("Could not find client manifest.");
        }
        const manifestJson = JSON.parse(manifest.source);
        let manifestFile = manifestJson[relative]?.file as string | undefined;
        manifestFile =
          manifestFile ??
          (manifestJson[`${relative}?commonjs-entry`]?.file as
            | string
            | undefined);

        if (!manifestFile) {
          const output = clientBuild.output.find(
            (o) => "facadeModuleId" in o && o.facadeModuleId === baseId
          );
          if (!output) {
            throw new Error(`Could not find browser output for ${baseId}`);
          }
          manifestFile = output.fileName;
        }

        return `export default "${this.environment.config.base}${manifestFile}";`;
      }
    },
  };
}
