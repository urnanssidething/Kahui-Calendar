import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClientForm } from "@/components/ClientForm";

export const dynamic = "force-dynamic";

export default async function EditClientPage(props: PageProps<"/clients/[id]/edit">) {
  const { id } = await props.params;

  const client = await db.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div>
      <h1 className="px-4 pt-5 text-xl font-semibold text-neutral-900">
        Edit client
      </h1>
      <ClientForm
        mode="edit"
        client={{
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          notes: client.notes,
          defaultRate: client.defaultRate ? Number(client.defaultRate) : null,
        }}
      />
    </div>
  );
}
