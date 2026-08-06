export const NZ_TZ = "Pacific/Auckland";

/** The NZ UTC offset (in minutes) in effect at the given instant — 720 (NZST) or 780 (NZDT). */
function nzOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NZ_TZ,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+13";
  const match = tzName.match(/GMT([+-]\d+)/);
  return (match ? parseInt(match[1], 10) : 13) * 60;
}

/** The {year, month, day} for the given instant, as seen on a NZ wall clock. */
function nzDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** "YYYY-MM-DD" for the given instant's NZ calendar day — safe for day-grouping keys. */
export function nzCalendarDayKey(date: Date): string {
  const { year, month, day } = nzDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * The UTC instant of NZ local midnight, `offsetDays` days from today (NZ time).
 * Used to build day-boundary ranges for querying jobs by NZ calendar date.
 */
export function nzMidnightUtc(offsetDays = 0): Date {
  const { year, month, day } = nzDateParts(new Date());
  // Calendar-date arithmetic done in UTC — only the Y/M/D matters here.
  const calendarDate = new Date(Date.UTC(year, month - 1, day + offsetDays));
  const offset = nzOffsetMinutes(calendarDate);
  return new Date(calendarDate.getTime() - offset * 60_000);
}

/** [start, end) UTC instants covering one NZ calendar day, `offsetDays` from today. */
export function nzDayRange(offsetDays = 0): { start: Date; end: Date } {
  const start = nzMidnightUtc(offsetDays);
  const end = nzMidnightUtc(offsetDays + 1);
  return { start, end };
}

export function formatNZDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatNZTime(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toLowerCase()
    .replace(" ", "");
}

export function formatNZWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    weekday: "short",
  }).format(date);
}

export function formatNZDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    day: "numeric",
    month: "short",
  }).format(date);
}

/** "2h ago", "just now", "3d ago" — for the "last edited" footer. */
export function formatRelativeTime(date: Date): string {
  const ms = Date.now() - date.getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
