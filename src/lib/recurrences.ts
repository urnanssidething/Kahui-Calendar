import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { nzMidnightUtc, nzCalendarDayKey, nzWallTimeToUtc } from "@/lib/date";

const HORIZON_WEEKS = 8;
const DAY_MS = 86_400_000;

function intervalDaysFor(pattern: string): number {
  if (pattern === "weekly") return 7;
  if (pattern === "fortnightly") return 14;
  return 28; // monthly, approximated as every 4 weeks (schema has no day-of-month field)
}

/**
 * Materializes concrete `jobs` rows for every active recurrence, out to an
 * 8-week horizon. Safe to call on every request: existing occurrences within
 * the window are skipped, so repeated calls are cheap no-ops once caught up.
 */
export async function ensureUpcomingJobsGenerated(userId: string) {
  const rangeStart = nzMidnightUtc(0);
  const rangeEnd = nzMidnightUtc(HORIZON_WEEKS * 7);

  const recurrences = await db.recurrence.findMany({ where: { active: true } });
  if (recurrences.length === 0) return;

  for (const recurrence of recurrences) {
    const intervalDays = intervalDaysFor(recurrence.pattern);

    const existing = await db.job.findMany({
      where: {
        recurrenceId: recurrence.id,
        startsAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: { startsAt: true },
    });
    const existingKeys = new Set(existing.map((j) => nzCalendarDayKey(j.startsAt)));

    let cursor = recurrence.startDate;
    if (cursor.getTime() < rangeStart.getTime()) {
      const steps = Math.ceil(
        (rangeStart.getTime() - cursor.getTime()) / (intervalDays * DAY_MS)
      );
      cursor = new Date(cursor.getTime() + steps * intervalDays * DAY_MS);
    }

    const toCreate: Prisma.JobCreateManyInput[] = [];
    while (cursor.getTime() < rangeEnd.getTime()) {
      const key = nzCalendarDayKey(cursor);
      if (!existingKeys.has(key)) {
        const startsAt = nzWallTimeToUtc(key, recurrence.time);
        const endsAt = new Date(startsAt.getTime() + recurrence.duration * 60_000);
        toCreate.push({
          clientId: recurrence.clientId,
          serviceType: recurrence.serviceType,
          startsAt,
          endsAt,
          address: recurrence.address,
          price: recurrence.price,
          status: "scheduled",
          recurrenceId: recurrence.id,
          createdById: userId,
          updatedById: userId,
        });
      }
      cursor = new Date(cursor.getTime() + intervalDays * DAY_MS);
    }

    if (toCreate.length > 0) {
      await db.job.createMany({ data: toCreate });
    }
  }
}
