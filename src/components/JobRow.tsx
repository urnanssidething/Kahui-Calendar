import Link from "next/link";
import type { JobWithRelations } from "@/lib/jobs";
import { shortAddress, SERVICE_TYPE_LABELS } from "@/lib/jobs";
import { formatNZTime } from "@/lib/date";
import { colorForUser } from "@/lib/colors";

export function JobRow({
  job,
  flagTurnaround = false,
}: {
  job: JobWithRelations;
  flagTurnaround?: boolean;
}) {
  const isCancelled = job.status === "cancelled";
  const isDone = job.status === "done";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-4 active:bg-neutral-50 ${
        isCancelled ? "opacity-50" : ""
      }`}
    >
      <div className="w-14 shrink-0 text-sm font-medium text-neutral-900">
        {formatNZTime(job.startsAt)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-neutral-900">
            {job.client.name}
          </span>
          {isDone && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              Done
            </span>
          )}
          {isCancelled && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              Cancelled
            </span>
          )}
          {flagTurnaround && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              Turnaround
            </span>
          )}
        </div>
        <div className="truncate text-sm text-neutral-500">
          {shortAddress(job.address)} ·{" "}
          {SERVICE_TYPE_LABELS[job.serviceType] ?? job.serviceType}
        </div>
      </div>

      {job.assignedTo && (
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorForUser(job.assignedTo.id).dot}`}
          title={job.assignedTo.name}
        />
      )}
    </Link>
  );
}
