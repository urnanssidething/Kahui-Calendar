import { login } from "@/lib/actions/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  const { error } = await props.searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-neutral-900">
          Kahui Queenstown
        </h1>
        <p className="mb-8 text-center text-sm text-neutral-500">
          Job calendar
        </p>

        <form action={login} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Wrong email or password. Try again.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-medium text-white active:bg-neutral-700"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
