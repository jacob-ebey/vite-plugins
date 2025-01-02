# @jacob-ebey/vite-react-server-dom

## 0.0.10

### Patch Changes

- [#23](https://github.com/jacob-ebey/vite-plugins/pull/23) [`8c807df`](https://github.com/jacob-ebey/vite-plugins/commit/8c807df467ffebb01cda0dc0ea46a07b85eef823) Thanks [@jacob-ebey](https://github.com/jacob-ebey)! - simplify react server plugin responsibilities

## 0.0.9

### Patch Changes

- [`48956e7`](https://github.com/jacob-ebey/vite-plugins/commit/48956e7635950db9b6f24443b0ca99f9a0bfca38) Thanks [@jacob-ebey](https://github.com/jacob-ebey)! - revert back to old plugin for now

## 0.0.7

### Patch Changes

- [`4fcb408`](https://github.com/jacob-ebey/vite-plugins/commit/4fcb4089ce5930896f539aa72b882efe98405a22) Thanks [@jacob-ebey](https://github.com/jacob-ebey)! - - provide manifest to internal `virtual:react-server-dom-vite/manifest` vmod
  - rename `/client-api` to `/prerender` and only expose `bootstrapModules` and `{ callServer }` from callServerPrerender
  - remove `/server-api` as it's provided through the internal vmod now

## 0.0.1

### Patch Changes

- [#16](https://github.com/jacob-ebey/vite-plugins/pull/16) [`14213b9`](https://github.com/jacob-ebey/vite-plugins/commit/14213b973bba2ac0fec271ca44c268ec94aa30c7) Thanks [@jacob-ebey](https://github.com/jacob-ebey)! - Initial release
