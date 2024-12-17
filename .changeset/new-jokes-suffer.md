---
"@jacob-ebey/vite-react-server-dom": patch
---

- provide manifest to internal `virtual:react-server-dom-vite/manifest` vmod
- rename `/client-api` to `/prerender` and only expose `bootstrapModules` and `{ callServer }` from callServerPrerender
- remove `/server-api` as it's provided through the internal vmod now
