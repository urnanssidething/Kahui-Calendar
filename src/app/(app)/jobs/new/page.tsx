import { db } from "@/lib/db";
import { JobForm } from "@/components/JobForm";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const [clients, users] = await Promise.all([
    db.client.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    db.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="px-4 pt-5 text-xl font-semibold text-neutral-900">
        New job
      </h1>
      <JobForm
        mode="create"
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          defaultRate: c.defaultRate ? Number(c.defaultRate) : null,
        }))}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}
