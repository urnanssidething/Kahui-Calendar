import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-neutral-500">
          {user.name}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm font-medium text-neutral-500 active:text-neutral-900"
          >
            Log out
          </button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <NavLink href="/" label="Today" />
        <NavLink href="/week" label="Week" />
        <NavLink href="/clients" label="Clients" />
      </nav>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center py-3 text-sm font-medium text-neutral-600 active:bg-neutral-100"
    >
      {label}
    </Link>
  );
}
