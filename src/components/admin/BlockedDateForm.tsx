"use client";

import { useActionState } from "react";
import { emptyState, type ActionState } from "@/actions/types";
import { SubmitButton } from "./SubmitButton";

export function BlockedDateForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, emptyState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Date</label>
          <input name="date" type="date" className="input" required />
        </div>
        <div>
          <label className="label">Motif (optionnel)</label>
          <input name="reason" className="input" placeholder="Congés, jour férié…" />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Jour bloqué ajouté.</p>}
      <SubmitButton pendingText="Ajout…">Bloquer cette date</SubmitButton>
    </form>
  );
}
