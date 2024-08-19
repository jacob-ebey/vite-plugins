import { renderToReadableStream } from "react-dom/server";

import App from "./app.js";

import browserEntry from "bridge:./browser.tsx";
import refreshScript from "./refresh-hack.js?raw";

export default {
  async fetch(request) {
    const body = await renderToReadableStream(
      <>
        <App />
        {import.meta.env.DEV ? (
          <script
            type="module"
            dangerouslySetInnerHTML={{ __html: refreshScript }}
          />
        ) : null}
      </>,
      {
        bootstrapModules: [browserEntry],
        onError: console.error,
        signal: request.signal,
      }
    );

    return new Response(body, {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  },
} satisfies ExportedHandler<Env>;
