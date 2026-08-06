import { createClient, updateClient } from "@/lib/actions/clients";

type ClientFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      client: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        address: string;
        notes: string | null;
        defaultRate: number | null;
      };
    };

export function ClientForm(props: ClientFormProps) {
  const action = props.mode === "create" ? createClient : updateClient;
  const client = props.mode === "edit" ? props.client : null;

  return (
    <form action={action} className="flex flex-col gap-5 px-4 py-5">
      {props.mode === "edit" && (
        <input type="hidden" name="clientId" value={props.client.id} />
      )}

      <Field label="Name">
        <input
          type="text"
          name="name"
          required
          defaultValue={client?.name}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          name="email"
          required
          defaultValue={client?.email}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Phone">
        <input
          type="tel"
          name="phone"
          defaultValue={client?.phone ?? ""}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Address">
        <input
          type="text"
          name="address"
          required
          defaultValue={client?.address}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Default rate (NZD)">
        <input
          type="number"
          name="defaultRate"
          min="0"
          step="0.01"
          defaultValue={client?.defaultRate ?? ""}
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={4}
          defaultValue={client?.notes ?? ""}
          placeholder="Gate codes, key location, pets, parking..."
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
        />
      </Field>

      <button
        type="submit"
        className="mt-2 rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-medium text-white active:bg-neutral-700"
      >
        {props.mode === "create" ? "Add client" : "Save changes"}
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
