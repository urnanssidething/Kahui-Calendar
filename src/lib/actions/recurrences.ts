"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nzWallTimeToUtc, nzDayOfWeek } from "@/lib/date";
import { ensureUpcomingJobsGenerated } from "@/lib/recurrences";

export async function createRecurrence(formData: FormData) {
  const user = await requireUser();

  const clientId = String(formData.get("clientId") ?? "");
  const pattern = String(formData.get("pattern") ?? "");
  const startDateStr = String(formData.get("startDate") ?? "");
  const time = String(formData.get("time") ?? "");
  const duration = Number(formData.get("duration") ?? 0);
  const serviceType = String(formData.get("serviceType") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");

  if (
    !clientId ||
    !pattern ||
    !startDateStr ||
    !time ||
    !duration ||
    !serviceType ||
    !address ||
    !priceRaw
  ) {
    return;
  }

  const price = Number(priceRaw);
  if (Number.isNaN(price) || price < 0) return;

  const startDate = nzWallTimeToUtc(startDateStr, "00:00");
  const dayOfWeek = nzDayOfWeek(startDate);

  await db.recurrence.create({
    data: {
      clientId,
      pattern: pattern as "weekly" | "fortnightly" | "monthly",
      startDate,
      dayOfWeek,
      time,
      duration,
      serviceType: serviceType as "airbnb" | "residential" | "commercial" | "window",
      price,
      address,
      active: true,
    },
  });

  await ensureUpcomingJobsGenerated(user.id);

  redirect(`/clients/${clientId}`);
}

export async function setRecurrenceActive(formData: FormData) {
  await requireUser();
  const recurrenceId = String(formData.get("recurrenceId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const active = formData.get("active") === "true";

  await db.recurrence.update({ where: { id: recurrenceId }, data: { active } });

  redirect(`/clients/${clientId}`);
}
