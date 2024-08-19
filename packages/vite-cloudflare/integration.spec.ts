import * as assert from "node:assert/strict";
import { after, describe, test, before } from "node:test";
import * as net from "node:net";

import type { ResultPromise } from "execa";
import { execa } from "execa";

describe("integration", () => {
  let url: string;
  let vitePromise: ResultPromise<{
    all: true;
    cwd: string;
  }>;
  before(async () => {
    const port = await getPort();
    vitePromise = execa({
      all: true,
      cwd: "fixture",
    })`pnpm dev --port ${port}`;

    await waitForPort(port);
    url = `http://localhost:${port}`;
  });
  after(async () => {
    if (!vitePromise.kill()) {
      throw new Error("Failed to kill Vite");
    }
    const exited = await vitePromise;
    if (!vitePromise.killed) {
      throw new Error("Vite did not exit");
    }
    assert.strictEqual(
      exited.exitCode,
      0,
      `Vite exited with code ${exited.exitCode}`
    );
  });

  test("should resolve proper conditions and allow local DurableObject, and Service bindings", async () => {
    const response = await fetch(url);
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

async function waitForPort(port: number) {
  while (true) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(port);
        socket.on("connect", () => {
          socket.end();
          resolve();
        });
        socket.on("error", (error) => {
          reject(error);
        });
      });
      return;
    } catch {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    }
  }
}

async function getPort() {
  const server = net.createServer();
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });
  const address = server.address();
  if (typeof address === "string" || !address) {
    throw new Error("Unexpected address");
  }
  const port = address.port;
  server.close();
  return port;
}
