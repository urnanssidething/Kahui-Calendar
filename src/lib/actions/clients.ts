"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function readClientFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const defaultRateRaw = String(formData.get("defaultRate") ?? "").trim();

  if (!name || !email || !address) {
    return { error: "Name, email, and address are required." } as const;
  }

  let defaultRate: number | null = null;
  if (defaultRateRaw) {
    defaultRate = Number(defaultRateRaw);
    if (Number.isNaN(defaultRate) || defaultRate < 0) {
      return { error: "Default rate must be a valid number." } as const;
    }
  }

  return { data: { name, email, phone, address, notes, defaultRate } } as const;
}

export async function createClient(formData: FormData) {
  await requireUser();
  const parsed = readClientFields(formData);
  if ("error" in parsed) return;

  const client = await db.client.create({ data: parsed.data });
  redirect(`/clients/${client.id}`);
}

export async function updateClient(formData: FormData) {
  await requireUser();
  const clientId = String(formData.get("clientId") ?? "");
  const parsed = readClientFields(formData);
  if ("error" in parsed) return;

  await db.client.update({ where: { id: clientId }, data: parsed.data });
  redirect(`/clients/${clientId}`);
}

export async function setClientArchived(formData: FormData) {
  await requireUser();
  const clientId = String(formData.get("clientId") ?? "");
  const archived = formData.get("archived") === "true";
  await db.client.update({ where: { id: clientId }, data: { archived } });
  redirect(`/clients/${clientId}`);
}
