import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { setJobStatus, deleteJob } from "@/lib/actions/jobs";
import { SERVICE_TYPE_LABELS } from "@/lib/jobs";
import { formatNZDate, formatNZTime, formatRelativeTime } from "@/lib/date";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function JobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;

  const job = await db.job.findUnique({
    where: { id },
    include: { client: true, assignedTo: true, updatedBy: true },
  });

  if (!job) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {job.client.name}
          </h1>
          <p className="text-sm text-neutral-500">
            {formatNZDate(job.startsAt)} · {formatNZTime(job.startsAt)}–
            {formatNZTime(job.endsAt)}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {job.client.phone && (
          <a
            href={`tel:${job.client.phone}`}
            className="rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
          >
            Call
          </a>
        )}
        {job.client.phone && (
          <a
            href={`sms:${job.client.phone}`}
            className="rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
          >
            Text
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
        >
          Open in Maps
        </a>
      </div>

      <dl className="mb-5 flex flex-col gap-3 rounded-xl bg-white p-4 text-sm">
        <Row label="Address" value={job.address} />
        <Row
          label="Service"
          value={SERVICE_TYPE_LABELS[job.serviceType] ?? job.serviceType}
        />
        <Row label="Price" value={`$${Number(job.price).toFixed(2)}`} />
        <Row label="Assigned to" value={job.assignedTo?.name ?? "Unassigned"} />
        {job.notes && <Row label="Notes" value={job.notes} />}
      </dl>

      {job.client.notes && (
        <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-1 font-medium">Client notes</p>
          <p>{job.client.notes}</p>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-2">
        {job.status !== "done" && (
          <form action={setJobStatus}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="status" value="done" />
            <button
              type="submit"
              className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white active:bg-neutral-700"
            >
              Mark done
            </button>
          </form>
        )}
        {job.status !== "cancelled" && (
          <form action={setJobStatus}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="status" value="cancelled" />
            <button
              type="submit"
              className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-700 active:bg-neutral-100"
            >
              Cancel job
            </button>
          </form>
        )}
        {job.status !== "scheduled" && (
          <form action={setJobStatus}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="status" value="scheduled" />
            <button
              type="submit"
              className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-700 active:bg-neutral-100"
            >
              Reopen job
            </button>
          </form>
        )}
      </div>

      <div className="mb-5 flex gap-2">
        <Link
          href={`/jobs/${job.id}/edit`}
          className="flex-1 rounded-xl border border-neutral-300 py-3 text-center text-sm font-medium active:bg-neutral-100"
        >
          Edit
        </Link>
        <form action={deleteJob} className="flex-1">
          <input type="hidden" name="jobId" value={job.id} />
          <ConfirmSubmitButton
            confirmMessage="Delete this job? This can't be undone."
            className="w-full rounded-xl border border-red-300 py-3 text-sm font-medium text-red-700 active:bg-red-50"
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>

      <p className="text-center text-xs text-neutral-400">
        Last edited by {job.updatedBy.name}, {formatRelativeTime(job.updatedAt)}
      </p>
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

function StatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return (
      <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
        Done
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
        Cancelled
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
      Scheduled
    </span>
  );
}
