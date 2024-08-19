import * as assert from "node:assert/strict";
import { after, describe, test, before } from "node:test";

import type { CloudflareDevEnvironment } from "@jacob-ebey/vite-cloudflare-plugin";
import * as vite from "vite";

describe("integration", () => {
  let server: vite.ViteDevServer;
  let worker: CloudflareDevEnvironment;

  before(async () => {
    server = await vite.createServer();
    server = await server.listen();
    worker = server.environments.worker as CloudflareDevEnvironment;
  });

  after(async () => {
    await server.close();
  });

  test("should call origin", async () => {
    const port = (server.httpServer!.address() as { port: number }).port;
    const response = await worker.dispatchFetch(
      new Request(`http://localhost:${port}/`)
    );
    assert.strictEqual(response.status, 200);

    const text = await response.text();
    assert.strictEqual(text, "Hello, origin!");
  });

  test("should passthrough on error", async () => {
    const port = (server.httpServer!.address() as { port: number }).port;
    const response = await worker.dispatchFetch(
      new Request(`http://localhost:${port}/error`)
    );
    assert.strictEqual(response.status, 200);

    const text = await response.text();
    assert.strictEqual(text, "Hello, origin!");
  });

  test("should fetch external", async () => {
    const port = (server.httpServer!.address() as { port: number }).port;
    const response = await worker.dispatchFetch(
      new Request(`http://localhost:${port}/todo`)
    );
    assert.strictEqual(response.status, 200);

    const json = await response.json();
    assert.deepStrictEqual(json, {
      userId: 1,
      id: 1,
      title: "delectus aut autem",
      completed: false,
    });
  });
});
