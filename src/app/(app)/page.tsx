import Link from "next/link";
import { getJobsInRange, findSameDayTurnarounds } from "@/lib/jobs";
import { nzDayRange, formatNZDayMonth } from "@/lib/date";
import { JobRow } from "@/components/JobRow";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = nzDayRange(0);
  const tomorrow = nzDayRange(1);

  const [todayJobs, tomorrowJobs] = await Promise.all([
    getJobsInRange(today.start, today.end),
    getJobsInRange(tomorrow.start, tomorrow.end),
  ]);

  const turnarounds = findSameDayTurnarounds([...todayJobs, ...tomorrowJobs]);

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-neutral-900">Today</h1>
        <Link
          href="/jobs/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white active:bg-neutral-700"
        >
          + New job
        </Link>
      </div>

      {todayJobs.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-neutral-500">
          No jobs today.
        </p>
      ) : (
        <div>
          {todayJobs.map((job) => (
            <JobRow key={job.id} job={job} flagTurnaround={turnarounds.has(job.id)} />
          ))}
        </div>
      )}

      <details className="mt-6">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-neutral-500">
          Tomorrow · {formatNZDayMonth(tomorrow.start)} ({tomorrowJobs.length})
        </summary>
        {tomorrowJobs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            No jobs tomorrow.
          </p>
        ) : (
          <div>
            {tomorrowJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                flagTurnaround={turnarounds.has(job.id)}
              />
            ))}
          </div>
        )}
      </details>
    </div>
  );
}
