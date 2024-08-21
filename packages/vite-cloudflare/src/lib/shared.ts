export const UNKNOWN_HOST = "http://localhost";
export const INIT_PATH = "/__vite_plugin_cloudflare_init__";

export interface RunnerEnv {
  __CLOUDFLARE_WORKER_RUNNER__: DurableObjectNamespace;
  __VITE_FETCH_MODULE__: {
    fetch: (request: Request) => Promise<Response>;
  };
  __VITE_ROOT__: string;
  __VITE_UNSAFE_EVAL__: {
    eval: (code: string, filename?: string) => unknown;
  };
}
