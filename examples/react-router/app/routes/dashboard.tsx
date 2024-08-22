import type {
  ActionFunctionArgs,
  AppLoadContext,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export async function loader({
  context: { session },
}: LoaderFunctionArgs<AppLoadContext>) {
  if (!session) {
    throw redirect("/");
  }

  const profile = await session.getUserProfile();

  return { profile };
}

export async function action({
  request,
  context: { session },
}: ActionFunctionArgs<AppLoadContext>) {
  if (!session) {
    throw redirect("/");
  }

  const body = new URLSearchParams(await request.text());
  const name = body.get("name");

  if (!name) {
    return {
      error: "Name is required",
    };
  }

  await session.setUserProfile({ name });

  return null;
}

export default function Dashboard() {
  const { profile } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { error } =
    (useActionData() as Awaited<ReturnType<typeof action>>) ?? {};

  const navigation = useNavigation();
  const pending = navigation.state !== "idle";

  return (
    <main>
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard!</p>

      <h3>Profile</h3>
      <Form
        method="POST"
        onSubmit={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        <label>
          Full Name
          <input
            type="text"
            name="name"
            required
            autoComplete="off"
            defaultValue={profile.name}
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
