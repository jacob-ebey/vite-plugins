import * as assert from "node:assert/strict";
import { after, describe, test, before } from "node:test";

import * as vite from "vite";

import type { CloudflareDevEnvironment } from "./src/index.js";

describe("integration", () => {
  let server: vite.ViteDevServer;
  let workera: CloudflareDevEnvironment;

  before(async () => {
    server = await vite.createServer({
      root: "fixture",
    });
    workera = server.environments.workera as CloudflareDevEnvironment;
  });

  after(async () => {
    await server.close();
  });

  test("should resolve proper conditions and allow local DurableObject, and Service bindings", async () => {
    const response = await workera.dispatchFetch(
      new Request("http://test.dev/")
    );
    assert.strictEqual(response.status, 200);

    const json = await response.json();
    assert.deepStrictEqual(json, {
      environmentSpecific: "a",
      workerB: {
        environmentSpecific: "b",
        counter: {
          environmentSpecific: "c",
          value: 0,
        },
      },
    });
  });
});
