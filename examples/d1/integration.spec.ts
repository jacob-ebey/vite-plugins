import * as assert from "node:assert/strict";
import { after, describe, test, before } from "node:test";

import type { CloudflareDevEnvironment } from "@jacob-ebey/vite-cloudflare-plugin";
import { $ } from "execa";
import * as vite from "vite";

describe("integration", () => {
  let server: vite.ViteDevServer;
  let worker: CloudflareDevEnvironment;

  before(async () => {
    const seed = await $`pnpm seed-development`;
    if (seed.failed) {
      throw new Error("Failed to seed development environment");
    }

    server = await vite.createServer();
    worker = server.environments.worker as CloudflareDevEnvironment;
  });

  after(async () => {
    await server.close();
  });

  test("should return list of categories", async () => {
    const response = await worker.dispatchFetch(
      new Request("http://test.dev/api/Category")
    );
    assert.strictEqual(response.status, 200);

    const json = await response.json();
    assert.deepStrictEqual(json, [
      {
        Id: 1,
        CategoryName: "Beverages",
        Description: "Soft drinks, coffees, teas, beers, and ales",
      },
      {
        Id: 2,
        CategoryName: "Condiments",
        Description:
          "Sweet and savory sauces, relishes, spreads, and seasonings",
      },
      {
        Id: 3,
        CategoryName: "Confections",
        Description: "Desserts, candies, and sweet breads",
      },
      {
        Id: 4,
        CategoryName: "Dairy Products",
        Description: "Cheeses",
      },
      {
        Id: 5,
        CategoryName: "Grains/Cereals",
        Description: "Breads, crackers, pasta, and cereal",
      },
      {
        Id: 6,
        CategoryName: "Meat/Poultry",
        Description: "Prepared meats",
      },
      {
        Id: 7,
        CategoryName: "Produce",
        Description: "Dried fruit and bean curd",
      },
      {
        Id: 8,
        CategoryName: "Seafood",
        Description: "Seaweed and fish",
      },
    ]);
  });
});
