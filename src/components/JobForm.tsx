"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { createJob, updateJob } from "@/lib/actions/jobs";
import { idleJobFormState, type JobFormState } from "@/lib/jobFormState";
import { formatRelativeTime } from "@/lib/date";

type ClientOption = {
  id: string;
  name: string;
  address: string;
  defaultRate: number | null;
};

type UserOption = { id: string; name: string };

const SERVICE_TYPES = [
  { value: "airbnb", label: "Airbnb" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "window", label: "Window" },
];

const DURATION_CHIPS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
  { label: "4h", minutes: 240 },
];

type JobFormProps = {
  clients: ClientOption[];
  users: UserOption[];
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      job: {
        id: string;
        clientId: string;
        serviceType: string;
        date: string;
        time: string;
        durationMinutes: number;
        address: string;
        price: number;
        assignedToId: string | null;
        notes: string | null;
        updatedAt: string;
        recurrenceId: string | null;
      };
    }
);

export function JobForm(props: JobFormProps) {
  const { clients, users } = props;
  const action = props.mode === "create" ? createJob : updateJob;
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(
    action,
    idleJobFormState
  );

  const initialClientId = props.mode === "edit" ? props.job.clientId : "";
  const initialClient = clients.find((c) => c.id === initialClientId);

  const [clientId, setClientId] = useState(initialClientId);
  const [address, setAddress] = useState(
    props.mode === "edit" ? props.job.address : initialClient?.address ?? ""
  );
  const [price, setPrice] = useState(
    props.mode === "edit"
      ? String(props.job.price)
      : initialClient?.defaultRate != null
        ? String(initialClient.defaultRate)
        : ""
  );
  const [duration, setDuration] = useState(
    props.mode === "edit" ? props.job.durationMinutes : 120
  );

  const forceInputRef = useRef<HTMLInputElement>(null);

  function handleClientChange(newClientId: string) {
    setClientId(newClientId);
    const client = clients.find((c) => c.id === newClientId);
    if (client) {
      setAddress(client.address);
      if (client.defaultRate != null) setPrice(String(client.defaultRate));
    }
  }

  function saveAnyway() {
    if (forceInputRef.current) forceInputRef.current.value = "true";
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-5">
      {props.mode === "edit" && (
        <>
          <input type="hidden" name="jobId" value={props.job.id} />
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={props.job.updatedAt}
          />
          <input
            ref={forceInputRef}
            type="hidden"
            name="force"
            defaultValue="false"
          />
        </>
      )}

      {props.mode === "edit" && props.job.recurrenceId && (
        <div className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-700">
          <p className="mb-2 font-medium">This job repeats. Apply changes to:</p>
          <label className="mb-1 flex items-center gap-2">
            <input type="radio" name="applyScope" value="this" defaultChecked />
            This job only
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="applyScope" value="future" />
            This and all future jobs
          </label>
        </div>
      )}

      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.status === "conflict" && (
        <div className="flex flex-col gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            This job was changed by {state.changedByName}{" "}
            {formatRelativeTime(new Date(state.changedAt))} while you were
            editing.
          </p>
          <div className="flex gap-2">
            <Link
              href={props.mode === "edit" ? `/jobs/${props.job.id}/edit` : "#"}
              className="rounded-lg border border-amber-300 px-3 py-2 text-center text-sm font-medium"
            >
              Reload latest
            </Link>
            <button
              type="submit"
              onClick={saveAnyway}
              className="flex-1 rounded-lg bg-amber-900 px-3 py-2 text-sm font-medium text-white"
            >
              Save my changes anyway
            </button>
          </div>
        </div>
      )}

      <Field label="Client">
        <select
          name="clientId"
          required
          value={clientId}
          onChange={(e) => handleClientChange(e.target.value)}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Date">
        <input
          type="date"
          name="date"
          required
          defaultValue={props.mode === "edit" ? props.job.date : undefined}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Start time">
        <input
          type="time"
          name="time"
          required
          defaultValue={props.mode === "edit" ? props.job.time : undefined}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Duration">
        <input type="hidden" name="duration" value={duration} />
        <div className="flex gap-2">
          {DURATION_CHIPS.map((chip) => (
            <button
              key={chip.minutes}
              type="button"
              onClick={() => setDuration(chip.minutes)}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium ${
                duration === chip.minutes
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Service type">
        <select
          name="serviceType"
          required
          defaultValue={props.mode === "edit" ? props.job.serviceType : ""}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        >
          <option value="" disabled>
            Select a service type
          </option>
          {SERVICE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Assigned to">
        <select
          name="assignedToId"
          defaultValue={
            props.mode === "edit" ? (props.job.assignedToId ?? "") : ""
          }
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Address">
        <input
          type="text"
          name="address"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={3}
          defaultValue={props.mode === "edit" ? (props.job.notes ?? "") : ""}
          placeholder="Gate codes, key location, pets, parking..."
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-medium text-white active:bg-neutral-700 disabled:opacity-50"
      >
        {pending
          ? "Saving..."
          : props.mode === "create"
            ? "Create job"
            : "Save changes"}
      </button>
    </form>
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
