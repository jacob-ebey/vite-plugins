import { DurableObject } from "cloudflare:workers";
import type {
  Session as SessionType,
  SessionStorage as SessionStorageType,
} from "react-router";
import { createRequestHandler, createCookieSessionStorage } from "react-router";

export type AppSessionData = { userId?: string };
export type AppSessionFlashData = unknown;

type SessionStorage = SessionStorageType<AppSessionData, AppSessionFlashData>;
export type Session = SessionType<AppSessionData, AppSessionFlashData>;

type UserInfo = {
  name?: string;
};

export class SessionDurableObject extends DurableObject<Env> {
  async fetch(request: Request) {
    const cookieSession = await getCookieSession(request, this.env);

    // @ts-expect-error - no types
    const build = await import("virtual:react-router/server-build");
    const response = await createRequestHandler(build, import.meta.env.MODE)(
      request,
      {
        env: this.env,
        cookieSession,
        session: this,
      }
    );

    return commitCookieSession(request, this.env, cookieSession, response);
  }

  async getUserProfile() {
    return (await this.ctx.storage.get<UserInfo>("userProfile")) ?? {};
  }

  setUserProfile(userData: UserInfo) {
    return this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.put("userProfile", userData);
    });
  }
}

function createStorage(request: Request, env: Env): SessionStorage {
  const url = new URL(request.url);

  return createCookieSessionStorage<AppSessionData, AppSessionFlashData>({
    cookie: {
      name: "__session",
      domain: url.hostname,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [env.SESSION_SECRET],
      secure: url.protocol === "https:" || url.protocol === "wss:",
    },
  });
}

export function getCookieSession(request: Request, env: Env): Promise<Session> {
  const storage = createStorage(request, env);

  return storage.getSession(request.headers.get("Cookie"));
}

export async function commitCookieSession(
  request: Request,
  env: Env,
  session: Session,
  response: Response
): Promise<Response> {
  const storage = createStorage(request, env);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", await storage.commitSession(session));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
