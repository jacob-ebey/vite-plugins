import { hydrateRoot } from "react-dom/client";

import App from "./app.js";

const root = hydrateRoot(document, <App />);

if (import.meta.hot) {
  import.meta.hot.accept(async () => {
    console.log("ACCEPTED");
    const App = (await import("./app.js")).default;
    root.render(<App />);
  });
}
