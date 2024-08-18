import { getValue } from "multi-condition-example";

export default {
  async fetch(request, env) {
    const workerB = await env.WORKERB.fetch("https://workerb").then((r) =>
      r.json()
    );

    return new Response(
      JSON.stringify({
        environmentSpecific: getValue(),
        workerB,
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  },
} satisfies ExportedHandler<Env>;
