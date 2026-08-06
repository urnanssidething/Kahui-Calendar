import { ClientForm } from "@/components/ClientForm";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="px-4 pt-5 text-xl font-semibold text-neutral-900">
        Add client
      </h1>
      <ClientForm mode="create" />
    </div>
  );
}
