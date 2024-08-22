import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  _: AppLoadContext
) {
  let status = responseStatusCode;
  const body = await renderToReadableStream(
    <ServerRouter context={entryContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        status = 500;
      },
    }
  );

  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  const headers = new Headers(responseHeaders);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Transfer-Encoding", "chunked");
  return new Response(body, {
    headers: responseHeaders,
    status,
  });
}
