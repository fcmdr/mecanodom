"use client";

import { useActionState } from "react";
import { emptyState, type ActionState } from "@/actions/types";
import { SubmitButton } from "./SubmitButton";

type Settings = {
  slotStepMin: number;
  bufferMin: number;
  minLeadHours: number;
  maxAdvanceDays: number;
};

export function SettingsForm({
  action,
  settings,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  settings: Settings;
}) {
  const [state, formAction] = useActionState(action, emptyState);

  const fields = [
    {
      name: "slotStepMin",
      label: "Pas des créneaux (min)",
      value: settings.slotStepMin,
      help: "Intervalle entre deux débuts de créneaux.",
    },
    {
      name: "bufferMin",
      label: "Marge entre RDV (min)",
      value: settings.bufferMin,
      help: "Temps tampon avant/après chaque intervention.",
    },
    {
      name: "minLeadHours",
      label: "Délai minimum (heures)",
      value: settings.minLeadHours,
      help: "Réservation impossible en-deçà de ce délai.",
    },
    {
      name: "maxAdvanceDays",
      label: "Réservation max (jours)",
      value: settings.maxAdvanceDays,
      help: "Fenêtre de réservation à l'avance.",
    },
  ];

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="label">{f.label}</label>
            <input
              name={f.name}
              type="number"
              min="0"
              className="input"
              defaultValue={f.value}
              required
            />
            <p className="mt-1 text-xs text-slate-500">{f.help}</p>
          </div>
        ))}
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Paramètres enregistrés.</p>}
      <SubmitButton pendingText="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
