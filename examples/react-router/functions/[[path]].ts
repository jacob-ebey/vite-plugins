// @ts-expect-error
import worker from "../build/server/index.js";

export const onRequest: PagesFunction<Env> = (c) => {
  return worker.fetch(c.request, c.env, c);
};
