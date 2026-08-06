import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { JobForm } from "@/components/JobForm";
import { nzDateInputValue, nzTimeInputValue } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function EditJobPage(props: PageProps<"/jobs/[id]/edit">) {
  const { id } = await props.params;

  const [job, clients, users] = await Promise.all([
    db.job.findUnique({ where: { id } }),
    db.client.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    db.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!job) notFound();

  const durationMinutes = Math.round(
    (job.endsAt.getTime() - job.startsAt.getTime()) / 60_000
  );

  return (
    <div>
      <h1 className="px-4 pt-5 text-xl font-semibold text-neutral-900">
        Edit job
      </h1>
      <JobForm
        mode="edit"
        job={{
          id: job.id,
          clientId: job.clientId,
          serviceType: job.serviceType,
          date: nzDateInputValue(job.startsAt),
          time: nzTimeInputValue(job.startsAt),
          durationMinutes,
          address: job.address,
          price: Number(job.price),
          assignedToId: job.assignedToId,
          notes: job.notes,
          updatedAt: job.updatedAt.toISOString(),
          recurrenceId: job.recurrenceId,
        }}
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
