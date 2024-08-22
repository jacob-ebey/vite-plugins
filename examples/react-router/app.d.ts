import "react-router";

import type { Session, SessionDurableObject } from "./app/session.ts";

declare module "react-router" {
  interface AppLoadContext {
    env: Env;
    cookieSession: Session;
    session?: SessionDurableObject;
  }

  interface LoaderFunctionArgs<Context = any> {
    request: Request;
    params: Params;
    context: Context;
  }

  interface ActionFunctionArgs<Context = any> {
    request: Request;
    params: Params;
    context: Context;
  }
}
