export default {
  fetch(request: Request) {
    return new Response(`Hello, origin!`);
  },
};
