import Link from "next/link";
import { db } from "@/lib/db";
import { jobListInclude, findSameDayTurnarounds } from "@/lib/jobs";
import { JobRow } from "@/components/JobRow";
import {
  nzMidnightUtc,
  nzDayOfWeek,
  nzWallTimeToUtc,
  nzDateInputValue,
  formatNZWeekday,
  formatNZDayMonth,
  nzCalendarDayKey,
} from "@/lib/date";

export const dynamic = "force-dynamic";

function mondayOfCurrentWeek(): Date {
  const today = nzMidnightUtc(0);
  const dow = nzDayOfWeek(today); // 0=Sun..6=Sat
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  return nzMidnightUtc(-daysSinceMonday);
}

export default async function WeekPage(props: PageProps<"/week">) {
  const { start } = await props.searchParams;
  const startParam = typeof start === "string" ? start : null;

  const weekStart = startParam
    ? nzWallTimeToUtc(startParam, "00:00")
    : mondayOfCurrentWeek();

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart.getTime() + i * 86_400_000);
    const dayEnd = new Date(weekStart.getTime() + (i + 1) * 86_400_000);
    return { dayStart, dayEnd };
  });

  const weekEnd = days[6].dayEnd;

  const jobs = await db.job.findMany({
    where: { startsAt: { gte: weekStart, lt: weekEnd } },
    orderBy: { startsAt: "asc" },
    include: jobListInclude(),
  });

  const turnarounds = findSameDayTurnarounds(jobs);

  const jobsByDay = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const key = nzCalendarDayKey(job.startsAt);
    const group = jobsByDay.get(key);
    if (group) group.push(job);
    else jobsByDay.set(key, [job]);
  }

  const todayKey = nzCalendarDayKey(nzMidnightUtc(0));

  const prevStart = nzDateInputValue(
    new Date(weekStart.getTime() - 7 * 86_400_000)
  );
  const nextStart = nzDateInputValue(
    new Date(weekStart.getTime() + 7 * 86_400_000)
  );

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <Link
          href={`/week?start=${prevStart}`}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium active:bg-neutral-100"
        >
          ‹ Prev
        </Link>
        <h1 className="text-xl font-semibold text-neutral-900">Week</h1>
        <Link
          href={`/week?start=${nextStart}`}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium active:bg-neutral-100"
        >
          Next ›
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-4">
        {days.map(({ dayStart }) => {
          const key = nzCalendarDayKey(dayStart);
          const isToday = key === todayKey;
          const count = jobsByDay.get(key)?.length ?? 0;
          return (
            <a
              key={key}
              href={`#day-${key}`}
              className={`flex shrink-0 flex-col items-center rounded-xl px-4 py-2 text-sm ${
                isToday
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 border border-neutral-200"
              }`}
            >
              <span className="font-medium">{formatNZWeekday(dayStart)}</span>
              <span>{formatNZDayMonth(dayStart)}</span>
              {count > 0 && (
                <span
                  className={`mt-1 text-xs ${isToday ? "text-neutral-300" : "text-neutral-400"}`}
                >
                  {count} job{count === 1 ? "" : "s"}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {days.map(({ dayStart }) => {
        const key = nzCalendarDayKey(dayStart);
        const dayJobs = jobsByDay.get(key) ?? [];
        return (
          <section key={key} id={`day-${key}`} className="scroll-mt-4">
            <h2 className="px-4 py-2 text-sm font-medium text-neutral-500">
              {formatNZWeekday(dayStart)}, {formatNZDayMonth(dayStart)}
              {key === todayKey ? " · Today" : ""}
            </h2>
            {dayJobs.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-neutral-400">No jobs.</p>
            ) : (
              <div className="mb-2">
                {dayJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    flagTurnaround={turnarounds.has(job.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
