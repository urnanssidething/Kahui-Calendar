export type JobFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "conflict"; changedByName: string; changedAt: string };

export const idleJobFormState: JobFormState = { status: "idle" };
