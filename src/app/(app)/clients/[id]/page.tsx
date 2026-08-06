import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { setClientArchived } from "@/lib/actions/clients";
import { setRecurrenceActive } from "@/lib/actions/recurrences";
import { SERVICE_TYPE_LABELS } from "@/lib/jobs";
import { formatNZDate, formatNZTime } from "@/lib/date";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

const PATTERN_LABELS: Record<string, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Every 4 weeks",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ClientDetailPage(props: PageProps<"/clients/[id]">) {
  const { id } = await props.params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      jobs: { orderBy: { startsAt: "desc" }, take: 50 },
      recurrences: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!client) notFound();

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {client.name}
          </h1>
          <p className="text-sm text-neutral-500">{client.address}</p>
        </div>
        {client.archived && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            Archived
          </span>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
          >
            Call
          </a>
        )}
        {client.phone && (
          <a
            href={`sms:${client.phone}`}
            className="rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
          >
            Text
          </a>
        )}
      </div>

      <dl className="mb-5 flex flex-col gap-3 rounded-xl bg-white p-4 text-sm">
        <Row label="Email" value={client.email} />
        {client.phone && <Row label="Phone" value={client.phone} />}
        {client.defaultRate != null && (
          <Row label="Default rate" value={`$${Number(client.defaultRate).toFixed(2)}`} />
        )}
      </dl>

      {client.notes && (
        <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-1 font-medium">Notes</p>
          <p>{client.notes}</p>
        </div>
      )}

      <div className="mb-5 flex gap-2">
        <Link
          href={`/clients/${client.id}/edit`}
          className="flex-1 rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
        >
          Edit
        </Link>
        <form action={setClientArchived} className="flex-1">
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="archived" value={client.archived ? "false" : "true"} />
          {client.archived ? (
            <button
              type="submit"
              className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-700 active:bg-neutral-100"
            >
              Unarchive
            </button>
          ) : (
            <ConfirmSubmitButton
              confirmMessage="Archive this client? They'll stop appearing in the client picker for new jobs."
              className="w-full rounded-xl border border-red-300 py-3 text-sm font-medium text-red-700 active:bg-red-50"
            >
              Archive
            </ConfirmSubmitButton>
          )}
        </form>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">
            Recurring jobs
          </h2>
          <Link
            href={`/clients/${client.id}/recurrences/new`}
            className="text-sm font-medium text-neutral-900"
          >
            + Add
          </Link>
        </div>
        {client.recurrences.length === 0 ? (
          <p className="text-sm text-neutral-500">No recurring jobs.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white">
            {client.recurrences.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    {PATTERN_LABELS[r.pattern] ?? r.pattern} ·{" "}
                    {WEEKDAY_LABELS[r.dayOfWeek]} {r.time}
                  </p>
                  <p className="text-neutral-500">
                    {SERVICE_TYPE_LABELS[r.serviceType] ?? r.serviceType} · $
                    {Number(r.price).toFixed(2)}
                    {!r.active && " · Inactive"}
                  </p>
                </div>
                <form action={setRecurrenceActive}>
                  <input type="hidden" name="recurrenceId" value={r.id} />
                  <input type="hidden" name="clientId" value={client.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={r.active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium active:bg-neutral-100"
                  >
                    {r.active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-neutral-500">
        Job history
      </h2>
      {client.jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">No jobs yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white">
          {client.jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 text-sm active:bg-neutral-50 last:border-b-0"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {formatNZDate(job.startsAt)} · {formatNZTime(job.startsAt)}
                </p>
                <p className="text-neutral-500">
                  {SERVICE_TYPE_LABELS[job.serviceType] ?? job.serviceType}
                </p>
              </div>
              <span className="text-neutral-400 capitalize">{job.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
