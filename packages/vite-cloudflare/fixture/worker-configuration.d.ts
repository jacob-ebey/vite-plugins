// Generated by Wrangler on Sun Aug 18 2024 00:27:09 GMT-0700 (Pacific Daylight Time)
// by running `wrangler types --env development`

interface Env {
  COUNTERS: DurableObjectNamespace<import("./src/counter.ts").Counter>;
  WORKERB: Fetcher;
}
