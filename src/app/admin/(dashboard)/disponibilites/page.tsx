import { prisma } from "@/lib/prisma";
import { WEEKDAY_LABELS, formatDateFr } from "@/lib/utils";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { WorkingHoursForm } from "@/components/admin/WorkingHoursForm";
import { BlockedDateForm } from "@/components/admin/BlockedDateForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  updateBookingSettings,
  addWorkingHours,
  deleteWorkingHours,
  toggleWorkingHours,
  addBlockedDate,
  deleteBlockedDate,
} from "@/actions/availability";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminAvailabilityPage() {
  const [settings, workingHours, blockedDates] = await Promise.all([
    prisma.bookingSettings.findUnique({ where: { id: 1 } }),
    prisma.workingHours.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
  ]);

  const effectiveSettings = settings ?? {
    slotStepMin: 30,
    bufferMin: 0,
    minLeadHours: 12,
    maxAdvanceDays: 30,
  };

  const byWeekday = WEEKDAY_ORDER.map((d) => ({
    weekday: d,
    slots: workingHours.filter((w) => w.weekday === d),
  }));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disponibilités</h1>
        <p className="mt-1 text-sm text-slate-500">
          Définissez vos horaires, vos paramètres de réservation et vos jours
          indisponibles.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">
          Paramètres de réservation
        </h2>
        <div className="mt-4">
          <SettingsForm action={updateBookingSettings} settings={effectiveSettings} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">Horaires hebdomadaires</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ajoutez des plages horaires pour chaque jour travaillé.
        </p>

        <div className="mt-5 space-y-3">
          {byWeekday.map(({ weekday, slots }) => (
            <div
              key={weekday}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <span className="w-24 shrink-0 font-medium text-slate-900">
                {WEEKDAY_LABELS[weekday]}
              </span>
              {slots.length === 0 ? (
                <span className="text-sm text-slate-400">Fermé</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <span
                      key={s.id}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                        s.isActive
                          ? "border-slate-300 bg-white text-slate-700"
                          : "border-slate-200 bg-slate-100 text-slate-400 line-through"
                      }`}
                    >
                      {s.startTime}–{s.endTime}
                      <form action={toggleWorkingHours} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-slate-400 hover:text-brand"
                          title={s.isActive ? "Désactiver" : "Activer"}
                        >
                          {s.isActive ? "⏸" : "▶"}
                        </button>
                      </form>
                      <form action={deleteWorkingHours} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-slate-400 hover:text-red-600"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </form>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Ajouter une plage horaire
          </h3>
          <WorkingHoursForm action={addWorkingHours} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">Jours indisponibles</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bloquez des dates exceptionnelles (congés, jours fériés…).
        </p>

        <div className="mt-4">
          <BlockedDateForm action={addBlockedDate} />
        </div>

        <div className="mt-6">
          {blockedDates.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune date bloquée.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {blockedDates.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-slate-700">
                    <span className="font-medium capitalize">
                      {formatDateFr(b.date)}
                    </span>
                    {b.reason ? ` — ${b.reason}` : ""}
                    {b.date < today && (
                      <span className="ml-2 text-xs text-slate-400">(passée)</span>
                    )}
                  </span>
                  <form action={deleteBlockedDate}>
                    <input type="hidden" name="id" value={b.id} />
                    <ConfirmSubmit confirmMessage="Débloquer cette date ?">
                      Supprimer
                    </ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
