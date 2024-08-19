# vite-plugins

A collection of Vite plugins that I've created and use. Hope they help you out!

## Plugins

## [@jacob-ebey/vite-cloudflare-plugin](packages/vite-cloudflare/README.md) (unpublished)

A vite plugin that enables local development of Cloudflare Workers using Vite.

## [@jacob-ebey/vite-bridged-assets-plugin](packages/vite-bridged-assets/README.md) (unpublished)

A vite plugin that enables server environments to import asset URLs from the browser environment.

## Examples

- [Cloudflare D1](examples/d1/README.md) - A simple example of using the `@jacob-ebey/vite-cloudflare-plugin` to develop a Cloudflare Worker locally with D1 bindings.
- [Cloudflare Durable Object WebSocket](examples/durable-object-websocket/README.md) - An example of using the `@jacob-ebey/vite-cloudflare-plugin` to develop a Cloudflare Worker locally with Durable Object bindings and WebSockets.
- [Cloudflare Hono](examples/hono/README.md) - An example of using the `@jacob-ebey/vite-cloudflare-plugin` to develop a Cloudflare Worker locally with Hono.
- [Cloudflare Origin Server](examples/origin-server/README.md) - An example of using the `@jacob-ebey/vite-cloudflare-plugin` to develop a Cloudflare Worker locally with passthrough to a Node.js origin server.
- [Cloudflare R2](examples/r2/README.md) - An example of using the `@jacob-ebey/vite-cloudflare-plugin` to develop a Cloudflare Worker locally with R2 bindings.
- [React Bridge Assets](examples/react/README.md) - An example of using the `@jacob-ebey/vite-cloudflare-plugin` and `@jacob-ebey/vite-bridged-assets-plugin` to develop a Cloudflare Worker with React.
