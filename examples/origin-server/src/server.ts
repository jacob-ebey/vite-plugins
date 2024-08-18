export default {
  fetch(request: Request) {
    return new Response(`Hello, origin!\nURL: ${request.url}`);
  },
};
