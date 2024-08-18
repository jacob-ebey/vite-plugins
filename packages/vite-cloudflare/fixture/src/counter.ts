import { DurableObject } from "cloudflare:workers";

import { getValue } from "multi-condition-example";

export class Counter extends DurableObject {
  async getCounterValue() {
    let value = (await this.ctx.storage.get<number>("value")) ?? 0;
    return {
      environmentSpecific: getValue(),
      value,
    };
  }

  async increment(amount = 1) {
    let value: number = (await this.ctx.storage.get("value")) ?? 0;
    value += amount;
    await this.ctx.storage.put("value", value);
    return {
      environmentSpecific: getValue(),
      value,
    };
  }
}
