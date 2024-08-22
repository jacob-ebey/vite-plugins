import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";

import { parseSession } from "./session.js";

export class Session extends DurableObject {
  async fetch(request: Request) {
    // @ts-expect-error - no types
    const build = await import("virtual:react-router/server-build");
    return createRequestHandler(build, import.meta.env.MODE)(request, {
      env: this.env,
      ctx: this.ctx,
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const sessionId = await parseSession(request);

    if (sessionId) {
      const stub = env.DO_SESSION.get(env.DO_SESSION.idFromName(sessionId));
      return stub.fetch(request);
    }

    // @ts-expect-error - no types
    const build = await import("virtual:react-router/server-build");
    return createRequestHandler(build, import.meta.env.MODE)(request, {
      env,
      ctx,
    });
  },
} satisfies ExportedHandler<Env>;
