// vite.config.ts
import { createMiddleware } from "file:///C:/Users/jacob/git/vite-plugins/node_modules/.pnpm/@hattip+adapter-node@0.0.47/node_modules/@hattip/adapter-node/dist/index.js";
import cloudflare from "file:///C:/Users/jacob/git/vite-plugins/packages/vite-cloudflare/dist/index.js";
import { defineConfig } from "file:///C:/Users/jacob/git/vite-plugins/node_modules/.pnpm/vite@6.0.0-alpha.19_@types+node@22.4.0/node_modules/vite/dist/node/index.js";
var entry = "src/index.ts";
var vite_config_default = defineConfig({
  environments: {
    worker: {
      build: {
        rollupOptions: {
          input: entry
        }
      }
    }
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.worker);
    }
  },
  plugins: [
    cloudflare({
      environments: ["worker"]
    }),
    {
      name: "dev-server",
      async configureServer(server) {
        const workerDevEnvironment = server.environments.worker;
        const middleware = createMiddleware(
          (c) => {
            return workerDevEnvironment.dispatchFetch(entry, c.request);
          },
          { alwaysCallNext: false }
        );
        return () => {
          server.middlewares.use((req, res, next) => {
            req.url = req.originalUrl;
            middleware(req, res, next);
          });
        };
      }
    }
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqYWNvYlxcXFxnaXRcXFxcdml0ZS1wbHVnaW5zXFxcXGV4YW1wbGVzXFxcXGhvbm9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGphY29iXFxcXGdpdFxcXFx2aXRlLXBsdWdpbnNcXFxcZXhhbXBsZXNcXFxcaG9ub1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvamFjb2IvZ2l0L3ZpdGUtcGx1Z2lucy9leGFtcGxlcy9ob25vL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgY3JlYXRlTWlkZGxld2FyZSB9IGZyb20gXCJAaGF0dGlwL2FkYXB0ZXItbm9kZVwiO1xyXG5pbXBvcnQgY2xvdWRmbGFyZSwge1xyXG5cdHR5cGUgQ2xvdWRmbGFyZURldkVudmlyb25tZW50LFxyXG59IGZyb20gXCJAamFjb2ItZWJleS92aXRlLWNsb3VkZmxhcmUtcGx1Z2luXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG5jb25zdCBlbnRyeSA9IFwic3JjL2luZGV4LnRzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG5cdGVudmlyb25tZW50czoge1xyXG5cdFx0d29ya2VyOiB7XHJcblx0XHRcdGJ1aWxkOiB7XHJcblx0XHRcdFx0cm9sbHVwT3B0aW9uczoge1xyXG5cdFx0XHRcdFx0aW5wdXQ6IGVudHJ5LFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdH0sXHJcblx0YnVpbGRlcjoge1xyXG5cdFx0YXN5bmMgYnVpbGRBcHAoYnVpbGRlcikge1xyXG5cdFx0XHRhd2FpdCBidWlsZGVyLmJ1aWxkKGJ1aWxkZXIuZW52aXJvbm1lbnRzLndvcmtlcik7XHJcblx0XHR9LFxyXG5cdH0sXHJcblx0cGx1Z2luczogW1xyXG5cdFx0Y2xvdWRmbGFyZSh7XHJcblx0XHRcdGVudmlyb25tZW50czogW1wid29ya2VyXCJdLFxyXG5cdFx0fSksXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwiZGV2LXNlcnZlclwiLFxyXG5cdFx0XHRhc3luYyBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcblx0XHRcdFx0Y29uc3Qgd29ya2VyRGV2RW52aXJvbm1lbnQgPSBzZXJ2ZXIuZW52aXJvbm1lbnRzXHJcblx0XHRcdFx0XHQud29ya2VyIGFzIENsb3VkZmxhcmVEZXZFbnZpcm9ubWVudDtcclxuXHJcblx0XHRcdFx0Y29uc3QgbWlkZGxld2FyZSA9IGNyZWF0ZU1pZGRsZXdhcmUoXHJcblx0XHRcdFx0XHQoYykgPT4ge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gd29ya2VyRGV2RW52aXJvbm1lbnQuZGlzcGF0Y2hGZXRjaChlbnRyeSwgYy5yZXF1ZXN0KTtcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHR7IGFsd2F5c0NhbGxOZXh0OiBmYWxzZSB9LFxyXG5cdFx0XHRcdCk7XHJcblxyXG5cdFx0XHRcdHJldHVybiAoKSA9PiB7XHJcblx0XHRcdFx0XHRzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRyZXEudXJsID0gcmVxLm9yaWdpbmFsVXJsO1xyXG5cdFx0XHRcdFx0XHRtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdF0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVVLFNBQVMsd0JBQXdCO0FBQ3hXLE9BQU8sZ0JBRUE7QUFDUCxTQUFTLG9CQUFvQjtBQUU3QixJQUFNLFFBQVE7QUFFZCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQixjQUFjO0FBQUEsSUFDYixRQUFRO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTixlQUFlO0FBQUEsVUFDZCxPQUFPO0FBQUEsUUFDUjtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1IsTUFBTSxTQUFTLFNBQVM7QUFDdkIsWUFBTSxRQUFRLE1BQU0sUUFBUSxhQUFhLE1BQU07QUFBQSxJQUNoRDtBQUFBLEVBQ0Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLFdBQVc7QUFBQSxNQUNWLGNBQWMsQ0FBQyxRQUFRO0FBQUEsSUFDeEIsQ0FBQztBQUFBLElBQ0Q7QUFBQSxNQUNDLE1BQU07QUFBQSxNQUNOLE1BQU0sZ0JBQWdCLFFBQVE7QUFDN0IsY0FBTSx1QkFBdUIsT0FBTyxhQUNsQztBQUVGLGNBQU0sYUFBYTtBQUFBLFVBQ2xCLENBQUMsTUFBTTtBQUNOLG1CQUFPLHFCQUFxQixjQUFjLE9BQU8sRUFBRSxPQUFPO0FBQUEsVUFDM0Q7QUFBQSxVQUNBLEVBQUUsZ0JBQWdCLE1BQU07QUFBQSxRQUN6QjtBQUVBLGVBQU8sTUFBTTtBQUNaLGlCQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQzFDLGdCQUFJLE1BQU0sSUFBSTtBQUNkLHVCQUFXLEtBQUssS0FBSyxJQUFJO0FBQUEsVUFDMUIsQ0FBQztBQUFBLFFBQ0Y7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
