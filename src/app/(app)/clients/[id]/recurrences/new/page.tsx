import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createRecurrence } from "@/lib/actions/recurrences";

export default async function NewRecurrencePage(
  props: PageProps<"/clients/[id]/recurrences/new">
) {
  const { id } = await props.params;
  const client = await db.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div>
      <h1 className="px-4 pt-5 text-xl font-semibold text-neutral-900">
        New recurring clean
      </h1>
      <p className="px-4 pb-3 text-sm text-neutral-500">for {client.name}</p>

      <form action={createRecurrence} className="flex flex-col gap-5 px-4 py-5">
        <input type="hidden" name="clientId" value={client.id} />

        <Field label="Repeats">
          <select
            name="pattern"
            required
            defaultValue="fortnightly"
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          >
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Every 4 weeks</option>
          </select>
        </Field>

        <Field label="First occurrence">
          <input
            type="date"
            name="startDate"
            required
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="Start time">
          <input
            type="time"
            name="time"
            required
            defaultValue="09:00"
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="Duration (minutes)">
          <input
            type="number"
            name="duration"
            required
            min="15"
            step="15"
            defaultValue={120}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="Service type">
          <select
            name="serviceType"
            required
            defaultValue="residential"
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          >
            <option value="airbnb">Airbnb</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="window">Window</option>
          </select>
        </Field>

        <Field label="Address">
          <input
            type="text"
            name="address"
            required
            defaultValue={client.address}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="Price (NZD)">
          <input
            type="number"
            name="price"
            required
            min="0"
            step="0.01"
            defaultValue={client.defaultRate ? Number(client.defaultRate) : undefined}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          />
        </Field>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-medium text-white active:bg-neutral-700"
        >
          Create recurring clean
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
