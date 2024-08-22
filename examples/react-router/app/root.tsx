import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "./styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header>
          <h1>React Router ❤️ Cloudflare</h1>
          <p>The power of the modern web at your fingertips.</p>
        </header>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
