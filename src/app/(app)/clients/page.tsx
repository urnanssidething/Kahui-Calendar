import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClientsPage(props: PageProps<"/clients">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const clients = await db.client.findMany({
    where: {
      archived: false,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-neutral-900">Clients</h1>
        <Link
          href="/clients/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white active:bg-neutral-700"
        >
          + Add client
        </Link>
      </div>

      <form action="/clients" className="px-4 pb-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name or address"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </form>

      {clients.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-neutral-500">
          {query ? `No clients match "${query}".` : "No clients yet."}
        </p>
      ) : (
        <div>
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex flex-col gap-0.5 border-b border-neutral-100 bg-white px-4 py-4 active:bg-neutral-50"
            >
              <span className="font-medium text-neutral-900">{client.name}</span>
              <span className="text-sm text-neutral-500">{client.address}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
