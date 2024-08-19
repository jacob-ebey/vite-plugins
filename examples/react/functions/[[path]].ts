// @ts-expect-error
import worker from "../dist/worker/worker.js";

export const onRequest: PagesFunction<Env> = (c) => {
  return worker.fetch(c.request, c.env, c);
};
