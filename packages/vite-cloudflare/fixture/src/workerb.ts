import { getValue } from "multi-condition-example";

export default {
  async fetch(request, env) {
    const counter = env.COUNTERS.get(env.COUNTERS.idFromName(""));

    return new Response(
      JSON.stringify({
        environmentSpecific: getValue(),
        counter: await counter.getCounterValue(),
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  },
} satisfies ExportedHandler<Env>;
