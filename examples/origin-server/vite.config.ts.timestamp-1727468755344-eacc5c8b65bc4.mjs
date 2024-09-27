// vite.config.ts
import { createMiddleware } from "file:///C:/Users/jacob/git/vite-plugins/node_modules/.pnpm/@hattip+adapter-node@0.0.47/node_modules/@hattip/adapter-node/dist/index.js";
import cloudflare from "file:///C:/Users/jacob/git/vite-plugins/packages/vite-cloudflare/dist/index.js";
import { createServerModuleRunner, defineConfig } from "file:///C:/Users/jacob/git/vite-plugins/node_modules/.pnpm/vite@6.0.0-alpha.19_@types+node@22.4.0/node_modules/vite/dist/node/index.js";
var originEntry = "src/server.ts";
var workerEntry = "src/worker.ts";
var vite_config_default = defineConfig(() => {
  let serverRunner;
  let origin;
  return {
    environments: {
      server: {
        nodeCompatible: true,
        build: {
          ssr: true,
          outDir: "dist/server",
          rollupOptions: {
            input: originEntry
          }
        }
      },
      worker: {
        build: {
          outDir: "dist/worker",
          rollupOptions: {
            input: workerEntry
          }
        }
      }
    },
    builder: {
      async buildApp(builder) {
        await Promise.all([
          builder.build(builder.environments.server),
          builder.build(builder.environments.worker)
        ]);
      }
    },
    server: {
      hmr: {
        path: "/__vite_hmr"
      }
    },
    plugins: [
      cloudflare({
        environments: ["worker"],
        async outboundService(request) {
          const url = new URL(request.url);
          if (url.origin === origin) {
            const mod = await serverRunner.import(originEntry);
            return await mod.default.fetch(request);
          }
          return await fetch(request);
        }
      }),
      {
        name: "dev-server",
        async configureServer(server) {
          serverRunner = createServerModuleRunner(server.environments.server);
          const workerDevEnvironment = server.environments.worker;
          const httpServer = server.httpServer;
          if (!httpServer) {
            throw new Error("Server must have an http server");
          }
          httpServer.once("listening", () => {
            const _address = httpServer.address();
            if (typeof _address === "string") {
              const [host, port] = _address.split(":");
              origin = `http://localhost:${port}`;
            } else if (_address) {
              origin = `http://localhost:${_address.port}`;
            } else {
              throw new Error("Could not determine server address");
            }
          });
          const middleware = createMiddleware(
            (c) => {
              return workerDevEnvironment.dispatchFetch(workerEntry, c.request);
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
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqYWNvYlxcXFxnaXRcXFxcdml0ZS1wbHVnaW5zXFxcXGV4YW1wbGVzXFxcXG9yaWdpbi1zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGphY29iXFxcXGdpdFxcXFx2aXRlLXBsdWdpbnNcXFxcZXhhbXBsZXNcXFxcb3JpZ2luLXNlcnZlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvamFjb2IvZ2l0L3ZpdGUtcGx1Z2lucy9leGFtcGxlcy9vcmlnaW4tc2VydmVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgY3JlYXRlTWlkZGxld2FyZSB9IGZyb20gXCJAaGF0dGlwL2FkYXB0ZXItbm9kZVwiO1xyXG5pbXBvcnQgY2xvdWRmbGFyZSwge1xyXG5cdHR5cGUgQ2xvdWRmbGFyZURldkVudmlyb25tZW50LFxyXG59IGZyb20gXCJAamFjb2ItZWJleS92aXRlLWNsb3VkZmxhcmUtcGx1Z2luXCI7XHJcbmltcG9ydCB7IGNyZWF0ZVNlcnZlck1vZHVsZVJ1bm5lciwgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuXHJcbmNvbnN0IG9yaWdpbkVudHJ5ID0gXCJzcmMvc2VydmVyLnRzXCI7XHJcbmNvbnN0IHdvcmtlckVudHJ5ID0gXCJzcmMvd29ya2VyLnRzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xyXG5cdGxldCBzZXJ2ZXJSdW5uZXI6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVNlcnZlck1vZHVsZVJ1bm5lcj47XHJcblx0bGV0IG9yaWdpbjogc3RyaW5nO1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0ZW52aXJvbm1lbnRzOiB7XHJcblx0XHRcdHNlcnZlcjoge1xyXG5cdFx0XHRcdG5vZGVDb21wYXRpYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGJ1aWxkOiB7XHJcblx0XHRcdFx0XHRzc3I6IHRydWUsXHJcblx0XHRcdFx0XHRvdXREaXI6IFwiZGlzdC9zZXJ2ZXJcIixcclxuXHRcdFx0XHRcdHJvbGx1cE9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdFx0aW5wdXQ6IG9yaWdpbkVudHJ5LFxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9LFxyXG5cdFx0XHR3b3JrZXI6IHtcclxuXHRcdFx0XHRidWlsZDoge1xyXG5cdFx0XHRcdFx0b3V0RGlyOiBcImRpc3Qvd29ya2VyXCIsXHJcblx0XHRcdFx0XHRyb2xsdXBPcHRpb25zOiB7XHJcblx0XHRcdFx0XHRcdGlucHV0OiB3b3JrZXJFbnRyeSxcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0fSxcclxuXHRcdH0sXHJcblx0XHRidWlsZGVyOiB7XHJcblx0XHRcdGFzeW5jIGJ1aWxkQXBwKGJ1aWxkZXIpIHtcclxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLmFsbChbXHJcblx0XHRcdFx0XHRidWlsZGVyLmJ1aWxkKGJ1aWxkZXIuZW52aXJvbm1lbnRzLnNlcnZlciksXHJcblx0XHRcdFx0XHRidWlsZGVyLmJ1aWxkKGJ1aWxkZXIuZW52aXJvbm1lbnRzLndvcmtlciksXHJcblx0XHRcdFx0XSk7XHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdFx0c2VydmVyOiB7XHJcblx0XHRcdGhtcjoge1xyXG5cdFx0XHRcdHBhdGg6IFwiL19fdml0ZV9obXJcIixcclxuXHRcdFx0fSxcclxuXHRcdH0sXHJcblx0XHRwbHVnaW5zOiBbXHJcblx0XHRcdGNsb3VkZmxhcmUoe1xyXG5cdFx0XHRcdGVudmlyb25tZW50czogW1wid29ya2VyXCJdLFxyXG5cdFx0XHRcdGFzeW5jIG91dGJvdW5kU2VydmljZShyZXF1ZXN0KSB7XHJcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHJlcXVlc3QudXJsKTtcclxuXHRcdFx0XHRcdGlmICh1cmwub3JpZ2luID09PSBvcmlnaW4pIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgbW9kID0gYXdhaXQgc2VydmVyUnVubmVyLmltcG9ydChvcmlnaW5FbnRyeSk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBhd2FpdCBtb2QuZGVmYXVsdC5mZXRjaChyZXF1ZXN0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBhd2FpdCBmZXRjaChyZXF1ZXN0KTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9KSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6IFwiZGV2LXNlcnZlclwiLFxyXG5cdFx0XHRcdGFzeW5jIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcclxuXHRcdFx0XHRcdHNlcnZlclJ1bm5lciA9IGNyZWF0ZVNlcnZlck1vZHVsZVJ1bm5lcihzZXJ2ZXIuZW52aXJvbm1lbnRzLnNlcnZlcik7XHJcblx0XHRcdFx0XHRjb25zdCB3b3JrZXJEZXZFbnZpcm9ubWVudCA9IHNlcnZlci5lbnZpcm9ubWVudHNcclxuXHRcdFx0XHRcdFx0LndvcmtlciBhcyBDbG91ZGZsYXJlRGV2RW52aXJvbm1lbnQ7XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgaHR0cFNlcnZlciA9IHNlcnZlci5odHRwU2VydmVyO1xyXG5cdFx0XHRcdFx0aWYgKCFodHRwU2VydmVyKSB7XHJcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlNlcnZlciBtdXN0IGhhdmUgYW4gaHR0cCBzZXJ2ZXJcIik7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aHR0cFNlcnZlci5vbmNlKFwibGlzdGVuaW5nXCIsICgpID0+IHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgX2FkZHJlc3MgPSBodHRwU2VydmVyLmFkZHJlc3MoKTtcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBfYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnN0IFtob3N0LCBwb3J0XSA9IF9hZGRyZXNzLnNwbGl0KFwiOlwiKTtcclxuXHRcdFx0XHRcdFx0XHRvcmlnaW4gPSBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YDtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChfYWRkcmVzcykge1xyXG5cdFx0XHRcdFx0XHRcdG9yaWdpbiA9IGBodHRwOi8vbG9jYWxob3N0OiR7X2FkZHJlc3MucG9ydH1gO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBkZXRlcm1pbmUgc2VydmVyIGFkZHJlc3NcIik7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdGNvbnN0IG1pZGRsZXdhcmUgPSBjcmVhdGVNaWRkbGV3YXJlKFxyXG5cdFx0XHRcdFx0XHQoYykgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiB3b3JrZXJEZXZFbnZpcm9ubWVudC5kaXNwYXRjaEZldGNoKHdvcmtlckVudHJ5LCBjLnJlcXVlc3QpO1xyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHR7IGFsd2F5c0NhbGxOZXh0OiBmYWxzZSB9LFxyXG5cdFx0XHRcdFx0KTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4gKCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdHJlcS51cmwgPSByZXEub3JpZ2luYWxVcmw7XHJcblx0XHRcdFx0XHRcdFx0bWlkZGxld2FyZShyZXEsIHJlcywgbmV4dCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9LFxyXG5cdFx0XSxcclxuXHR9O1xyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVyxTQUFTLHdCQUF3QjtBQUNuWSxPQUFPLGdCQUVBO0FBQ1AsU0FBUywwQkFBMEIsb0JBQW9CO0FBRXZELElBQU0sY0FBYztBQUNwQixJQUFNLGNBQWM7QUFFcEIsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDakMsTUFBSTtBQUNKLE1BQUk7QUFFSixTQUFPO0FBQUEsSUFDTixjQUFjO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxRQUNoQixPQUFPO0FBQUEsVUFDTixLQUFLO0FBQUEsVUFDTCxRQUFRO0FBQUEsVUFDUixlQUFlO0FBQUEsWUFDZCxPQUFPO0FBQUEsVUFDUjtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDUCxPQUFPO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixlQUFlO0FBQUEsWUFDZCxPQUFPO0FBQUEsVUFDUjtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1IsTUFBTSxTQUFTLFNBQVM7QUFDdkIsY0FBTSxRQUFRLElBQUk7QUFBQSxVQUNqQixRQUFRLE1BQU0sUUFBUSxhQUFhLE1BQU07QUFBQSxVQUN6QyxRQUFRLE1BQU0sUUFBUSxhQUFhLE1BQU07QUFBQSxRQUMxQyxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0Q7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNQLEtBQUs7QUFBQSxRQUNKLE1BQU07QUFBQSxNQUNQO0FBQUEsSUFDRDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1IsV0FBVztBQUFBLFFBQ1YsY0FBYyxDQUFDLFFBQVE7QUFBQSxRQUN2QixNQUFNLGdCQUFnQixTQUFTO0FBQzlCLGdCQUFNLE1BQU0sSUFBSSxJQUFJLFFBQVEsR0FBRztBQUMvQixjQUFJLElBQUksV0FBVyxRQUFRO0FBQzFCLGtCQUFNLE1BQU0sTUFBTSxhQUFhLE9BQU8sV0FBVztBQUNqRCxtQkFBTyxNQUFNLElBQUksUUFBUSxNQUFNLE9BQU87QUFBQSxVQUN2QztBQUNBLGlCQUFPLE1BQU0sTUFBTSxPQUFPO0FBQUEsUUFDM0I7QUFBQSxNQUNELENBQUM7QUFBQSxNQUNEO0FBQUEsUUFDQyxNQUFNO0FBQUEsUUFDTixNQUFNLGdCQUFnQixRQUFRO0FBQzdCLHlCQUFlLHlCQUF5QixPQUFPLGFBQWEsTUFBTTtBQUNsRSxnQkFBTSx1QkFBdUIsT0FBTyxhQUNsQztBQUVGLGdCQUFNLGFBQWEsT0FBTztBQUMxQixjQUFJLENBQUMsWUFBWTtBQUNoQixrQkFBTSxJQUFJLE1BQU0saUNBQWlDO0FBQUEsVUFDbEQ7QUFFQSxxQkFBVyxLQUFLLGFBQWEsTUFBTTtBQUNsQyxrQkFBTSxXQUFXLFdBQVcsUUFBUTtBQUNwQyxnQkFBSSxPQUFPLGFBQWEsVUFBVTtBQUNqQyxvQkFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLFNBQVMsTUFBTSxHQUFHO0FBQ3ZDLHVCQUFTLG9CQUFvQixJQUFJO0FBQUEsWUFDbEMsV0FBVyxVQUFVO0FBQ3BCLHVCQUFTLG9CQUFvQixTQUFTLElBQUk7QUFBQSxZQUMzQyxPQUFPO0FBQ04sb0JBQU0sSUFBSSxNQUFNLG9DQUFvQztBQUFBLFlBQ3JEO0FBQUEsVUFDRCxDQUFDO0FBRUQsZ0JBQU0sYUFBYTtBQUFBLFlBQ2xCLENBQUMsTUFBTTtBQUNOLHFCQUFPLHFCQUFxQixjQUFjLGFBQWEsRUFBRSxPQUFPO0FBQUEsWUFDakU7QUFBQSxZQUNBLEVBQUUsZ0JBQWdCLE1BQU07QUFBQSxVQUN6QjtBQUVBLGlCQUFPLE1BQU07QUFDWixtQkFBTyxZQUFZLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUztBQUMxQyxrQkFBSSxNQUFNLElBQUk7QUFDZCx5QkFBVyxLQUFLLEtBQUssSUFBSTtBQUFBLFlBQzFCLENBQUM7QUFBQSxVQUNGO0FBQUEsUUFDRDtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
