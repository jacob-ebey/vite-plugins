import * as React from "react";

export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React App</title>
      </head>
      <body>
        <h1>Hello, World!</h1>

        <div>
          <button
            type="button"
            onClick={() => {
              setCount((c) => c - 1);
            }}
          >
            decrement
          </button>
          <span>{count}</span>
          <button
            type="button"
            onClick={() => {
              setCount((c) => c + 1);
            }}
          >
            increment
          </button>
        </div>
      </body>
    </html>
  );
}
