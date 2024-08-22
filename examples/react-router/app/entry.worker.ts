import { createRequestHandler } from "react-router";

import { commitCookieSession, getCookieSession } from "./session.js";

export { SessionDurableObject } from "./session.js";

export default {
  async fetch(request, env, ctx) {
    const cookieSession = await getCookieSession(request, env);
    const userId = cookieSession.get("userId");

    if (userId) {
      const stub = env.DO_SESSION.get(env.DO_SESSION.idFromName(userId));
      return stub.fetch(request);
    }

    // @ts-expect-error - no types
    const build = await import("virtual:react-router/server-build");
    const response = await createRequestHandler(build, import.meta.env.MODE)(
      request,
      {
        env,
        cookieSession,
      }
    );

    return commitCookieSession(request, env, cookieSession, response);
  },
} satisfies ExportedHandler<Env>;
