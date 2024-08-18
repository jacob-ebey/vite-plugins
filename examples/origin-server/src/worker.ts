export default {
  async fetch(request, env, ctx) {
    ctx.passThroughOnException();

    const url = new URL(request.url);
    if (url.pathname === "/error") {
      throw new Error("Error from worker should passthrough");
    }

    if (url.pathname === "/todo") {
      return fetch("https://jsonplaceholder.typicode.com/todos/1");
    }

    return await fetch(request);
  },
} satisfies ExportedHandler<Env>;
