import type {
  ActionFunctionArgs,
  AppLoadContext,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  unstable_data as data,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export function loader({
  context: {
    // session is our durable object stub
    session,
  },
}: LoaderFunctionArgs<AppLoadContext>) {
  if (session) {
    throw redirect("/dashboard");
  }

  return null;
}

export async function action({
  request,
  context: { cookieSession },
}: ActionFunctionArgs<AppLoadContext>) {
  const body = new URLSearchParams(await request.text());
  const email = body.get("email");
  const password = body.get("password");

  if (!email || !password) {
    return data({
      error: "Email and password are required",
    });
  }

  // Normally you would validate the email and password
  // and then check if the user exists in your database
  // and if the password matches the hashed password,
  // but for this example we'll just assume the user
  // exists and the password is correct.
  cookieSession.set("userId", email);
  throw redirect("/dashboard");
}

export default function Index() {
  const { error } =
    (useActionData() as Awaited<ReturnType<typeof action>>["data"]) ?? {};

  const navigation = useNavigation();
  const pending = navigation.state !== "idle";

  return (
    <main>
      <h2>Login</h2>
      <Form
        method="POST"
        onSubmit={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        <label>
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            // autoComplete="current-email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="off"
            // autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p>
            <em>{error}</em>
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? "Loading..." : "Login"}
        </button>
      </Form>
    </main>
  );
}
