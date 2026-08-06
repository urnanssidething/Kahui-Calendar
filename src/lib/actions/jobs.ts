"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nzWallTimeToUtc } from "@/lib/date";
import type { JobFormState } from "@/lib/jobFormState";

type ParsedJobFields =
  | { error: string }
  | {
      data: {
        clientId: string;
        serviceType: "airbnb" | "residential" | "commercial" | "window";
        startsAt: Date;
        endsAt: Date;
        address: string;
        price: number;
        assignedToId: string | null;
        notes: string | null;
      };
    };

function readJobFields(formData: FormData): ParsedJobFields {
  const clientId = String(formData.get("clientId") ?? "");
  const serviceType = String(formData.get("serviceType") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const durationMinutes = Number(formData.get("duration") ?? 0);
  const address = String(formData.get("address") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!clientId || !serviceType || !date || !time || !durationMinutes || !address || !priceRaw) {
    return { error: "Fill in all required fields." } as const;
  }

  const price = Number(priceRaw);
  if (Number.isNaN(price) || price < 0) {
    return { error: "Price must be a valid number." } as const;
  }

  const startsAt = nzWallTimeToUtc(date, time);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  return {
    data: {
      clientId,
      serviceType: serviceType as "airbnb" | "residential" | "commercial" | "window",
      startsAt,
      endsAt,
      address,
      price,
      assignedToId,
      notes,
    },
  } as const;
}

export async function createJob(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireUser();
  const parsed = readJobFields(formData);
  if ("error" in parsed) return { status: "error", message: parsed.error };

  const job = await db.job.create({
    data: {
      ...parsed.data,
      status: "scheduled",
      createdById: user.id,
      updatedById: user.id,
    },
  });

  redirect(`/jobs/${job.id}`);
}

export async function updateJob(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "");
  const force = formData.get("force") === "true";

  const parsed = readJobFields(formData);
  if ("error" in parsed) return { status: "error", message: parsed.error };

  const current = await db.job.findUnique({
    where: { id: jobId },
    include: { updatedBy: true },
  });
  if (!current) return { status: "error", message: "This job no longer exists." };

  if (!force && current.updatedAt.toISOString() !== expectedUpdatedAt) {
    return {
      status: "conflict",
      changedByName: current.updatedBy.name,
      changedAt: current.updatedAt.toISOString(),
    };
  }

  await db.job.update({
    where: { id: jobId },
    data: { ...parsed.data, updatedById: user.id },
  });

  redirect(`/jobs/${jobId}`);
}

export async function deleteJob(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  await db.job.delete({ where: { id: jobId } });
  redirect("/");
}

export async function setJobStatus(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "scheduled" && status !== "done" && status !== "cancelled") {
    return;
  }
  await db.job.update({
    where: { id: jobId },
    data: { status, updatedById: user.id },
  });
  redirect(`/jobs/${jobId}`);
}
