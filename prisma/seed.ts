import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient, ServiceType } from "../src/generated/prisma/client";
import { nzDayOfWeek } from "../src/lib/date";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Builds a Date for a given NZ wall-clock time, stored as the equivalent UTC instant.
// NZ is UTC+12 (NZST) / UTC+13 (NZDT). We don't need DST precision for seed data,
// so we use a fixed UTC+13 offset (winter/summer boundary doesn't matter for fake jobs).
function nzDate(daysFromNow: number, hour: number, minute = 0) {
  const now = new Date();
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysFromNow,
      hour - 13,
      minute
    )
  );
  return d;
}

async function main() {
  const user1 = await db.user.upsert({
    where: { email: requireEnv("SEED_USER_1_EMAIL") },
    update: {},
    create: {
      name: requireEnv("SEED_USER_1_NAME"),
      email: requireEnv("SEED_USER_1_EMAIL"),
      passwordHash: await bcrypt.hash(requireEnv("SEED_USER_1_PASSWORD"), 12),
    },
  });

  const user2 = await db.user.upsert({
    where: { email: requireEnv("SEED_USER_2_EMAIL") },
    update: {},
    create: {
      name: requireEnv("SEED_USER_2_NAME"),
      email: requireEnv("SEED_USER_2_EMAIL"),
      passwordHash: await bcrypt.hash(requireEnv("SEED_USER_2_PASSWORD"), 12),
    },
  });

  console.log(`Seeded users: ${user1.name}, ${user2.name}`);

  // Fortnightly residential client
  const janet = await db.client.create({
    data: {
      name: "Janet Cole",
      email: "janet.cole@example.co.nz",
      phone: "021 555 0142",
      address: "14 Fernhill Rd, Queenstown",
      notes: "Key in lockbox, code 4471. Small dog (friendly) — keep gate latched.",
      defaultRate: 180,
    },
  });

  let daysBack = 0;
  while (nzDayOfWeek(nzDate(-daysBack, 0)) !== 2) {
    daysBack++;
  }
  const recurrenceStart = nzDate(-daysBack, 0);

  await db.recurrence.create({
    data: {
      clientId: janet.id,
      pattern: "fortnightly",
      startDate: recurrenceStart,
      dayOfWeek: 2, // Tuesday
      time: "09:00",
      duration: 120,
      serviceType: ServiceType.residential,
      price: 180,
      address: janet.address,
      active: true,
    },
  });

  // Airbnb property with back-to-back turnovers (same-day turnaround)
  const lakeview = await db.client.create({
    data: {
      name: "Lakeview Escapes Ltd",
      email: "bookings@lakeviewescapes.example.com",
      phone: "03 555 0199",
      address: "8b Lake Esplanade, Queenstown",
      notes: "Linen cupboard is in the hallway. Guest guide on kitchen bench — leave for next guest.",
      defaultRate: 220,
    },
  });

  await db.job.create({
    data: {
      clientId: lakeview.id,
      serviceType: ServiceType.airbnb,
      startsAt: nzDate(1, 10, 0),
      endsAt: nzDate(1, 12, 0),
      address: lakeview.address,
      price: 220,
      status: "scheduled",
      notes: "Checkout clean — guest departs 10am.",
      assignedToId: user1.id,
      createdById: user1.id,
      updatedById: user1.id,
    },
  });

  await db.job.create({
    data: {
      clientId: lakeview.id,
      serviceType: ServiceType.airbnb,
      startsAt: nzDate(1, 13, 30),
      endsAt: nzDate(1, 15, 30),
      address: lakeview.address,
      price: 220,
      status: "scheduled",
      notes: "Turnaround clean — next guest checks in 4pm. Same-day as the checkout clean.",
      assignedToId: user2.id,
      createdById: user1.id,
      updatedById: user1.id,
    },
  });

  // Commercial job
  const alpine = await db.client.create({
    data: {
      name: "Alpine Dental Queenstown",
      email: "accounts@alpinedental.example.co.nz",
      phone: "03 555 0110",
      address: "22 Shotover St, Queenstown",
      notes: "After hours only — practice manager holds the key, buzz reception.",
      defaultRate: 150,
    },
  });

  await db.job.create({
    data: {
      clientId: alpine.id,
      serviceType: ServiceType.commercial,
      startsAt: nzDate(0, 18, 0),
      endsAt: nzDate(0, 19, 30),
      address: alpine.address,
      price: 150,
      status: "scheduled",
      notes: "Waiting room, 3x surgery rooms, staff kitchen.",
      assignedToId: user1.id,
      createdById: user2.id,
      updatedById: user2.id,
    },
  });

  // A window clean, for service_type variety
  const patel = await db.client.create({
    data: {
      name: "Raj Patel",
      email: "raj.patel@example.com",
      phone: "022 555 0176",
      address: "3 Peak View Terrace, Arthurs Point",
      notes: "Steep driveway — park on the street.",
      defaultRate: 95,
    },
  });

  await db.job.create({
    data: {
      clientId: patel.id,
      serviceType: ServiceType.window,
      startsAt: nzDate(2, 11, 0),
      endsAt: nzDate(2, 12, 0),
      address: patel.address,
      price: 95,
      status: "scheduled",
      notes: null,
      assignedToId: user2.id,
      createdById: user2.id,
      updatedById: user2.id,
    },
  });

  console.log("Seeded 4 clients, 1 recurrence, 4 jobs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
