import { db } from "@/lib/db";
import { nzCalendarDayKey } from "@/lib/date";

export function jobListInclude() {
  return {
    client: true,
    assignedTo: true,
    updatedBy: true,
  } as const;
}

export function getJobsInRange(start: Date, end: Date) {
  return db.job.findMany({
    where: { startsAt: { gte: start, lt: end } },
    orderBy: { startsAt: "asc" },
    include: jobListInclude(),
  });
}

export type JobWithRelations = Awaited<ReturnType<typeof getJobsInRange>>[number];

/** Short address for compact list rows — first comma-separated segment (street). */
export function shortAddress(address: string): string {
  return address.split(",")[0]?.trim() || address;
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  residential: "Residential",
  commercial: "Commercial",
  window: "Window",
};

/**
 * IDs of Airbnb jobs that share a client and calendar day with another Airbnb
 * job — i.e. a checkout clean and a check-in clean landing the same day, the
 * highest-risk job of the day per the spec.
 */
export function findSameDayTurnarounds(jobs: JobWithRelations[]): Set<string> {
  const byClientDay = new Map<string, JobWithRelations[]>();

  for (const job of jobs) {
    if (job.serviceType !== "airbnb" || job.status === "cancelled") continue;
    const dayKey = `${job.clientId}:${nzCalendarDayKey(job.startsAt)}`;
    const group = byClientDay.get(dayKey);
    if (group) group.push(job);
    else byClientDay.set(dayKey, [job]);
  }

  const flagged = new Set<string>();
  for (const group of byClientDay.values()) {
    if (group.length > 1) {
      for (const job of group) flagged.add(job.id);
    }
  }
  return flagged;
}
