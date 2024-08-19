import * as assert from "node:assert/strict";
import { after, describe, test, before } from "node:test";

import type { CloudflareDevEnvironment } from "@jacob-ebey/vite-cloudflare-plugin";
import * as vite from "vite";

describe("integration", () => {
  let server: vite.ViteDevServer;
  let worker: CloudflareDevEnvironment;

  before(async () => {
    server = await vite.createServer();
    worker = server.environments.worker as CloudflareDevEnvironment;
  });

  after(async () => {
    await server.close();
  });

  test("should hit hono handler", async () => {
    const response = await worker.dispatchFetch(
      new Request("http://test.dev/")
    );
    assert.strictEqual(response.status, 200);

    const text = await response.text();
    assert.strictEqual(text, "Hono!!");
  });
});
