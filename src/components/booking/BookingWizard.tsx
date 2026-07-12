"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDuration, formatIsoDateKeyFr } from "@/lib/utils";
import type { Slot } from "@/lib/availability";
import type { CoverageResult } from "@/lib/coverage";

export type WizardService = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  durationMin: number;
};
export type WizardCategory = {
  id: number;
  name: string;
  services: WizardService[];
};

type Props = {
  categories: WizardCategory[];
  maxAdvanceDays: number;
  initialServiceId?: number;
};

const STEPS = ["Prestation", "Date & créneau", "Adresse", "Coordonnées"];

/** Date locale (Europe/Paris) au format YYYY-MM-DD. */
function parisToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}
function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function BookingWizard({
  categories,
  maxAdvanceDays,
  initialServiceId,
}: Props) {
  const router = useRouter();
  const allServices = useMemo(
    () => categories.flatMap((c) => c.services),
    [categories],
  );

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<number | null>(
    initialServiceId ?? null,
  );

  // Étape 2
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsReason, setSlotsReason] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Étape 3
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);

  // Étape 4
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-spam : instant d'affichage + champ honeypot (invisible pour les humains)
  const renderedAtRef = useRef<number>(Date.now());
  const [honeypot, setHoneypot] = useState("");

  const selectedService = allServices.find((s) => s.id === serviceId) ?? null;
  const minDate = parisToday();
  const maxDate = addDays(minDate, maxAdvanceDays);

  async function loadSlots(newDate: string) {
    if (!serviceId || !newDate) return;
    setSlotsLoading(true);
    setSlotsReason(null);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/availability?serviceId=${serviceId}&date=${newDate}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setSlotsReason(data.error ?? "Erreur");
        return;
      }
      setSlots(data.slots ?? []);
      if ((data.slots ?? []).length === 0) {
        setSlotsReason(data.reason ?? "Aucun créneau disponible ce jour-là.");
      }
    } catch {
      setSlotsReason("Impossible de charger les créneaux.");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function checkPostalCode() {
    const code = postalCode.replace(/\D/g, "");
    if (code.length !== 5) {
      setCoverage(null);
      setError("Entrez un code postal à 5 chiffres.");
      return;
    }
    setError(null);
    setCoverageLoading(true);
    try {
      const res = await fetch(`/api/coverage?postalCode=${code}`);
      const data: CoverageResult = await res.json();
      setCoverage(data);
    } catch {
      setError("Impossible de vérifier la couverture.");
    } finally {
      setCoverageLoading(false);
    }
  }

  async function handleSubmit() {
    if (!serviceId || !selectedSlot || !coverage?.covered) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: honeypot, // honeypot anti-spam
          renderedAt: renderedAtRef.current,
          serviceId,
          startUtc: selectedSlot.startUtc,
          customerName,
          customerEmail,
          customerPhone,
          vehicleMake,
          vehicleModel,
          vehicleYear: vehicleYear || undefined,
          vehiclePlate,
          address,
          postalCode: coverage.postalCode,
          city: coverage.city ?? "",
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        // Si le créneau n'est plus dispo, on renvoie l'utilisateur à l'étape 2
        if (res.status === 409) {
          setStep(2);
          if (date) loadSlots(date);
        }
        return;
      }
      router.push(`/rendez-vous/confirmation?id=${data.id}`);
    } catch {
      setError("Impossible d'enregistrer la réservation. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext1 = serviceId !== null;
  const canNext2 = selectedSlot !== null;
  const canNext3 = coverage?.covered === true && address.trim().length >= 4;
  const canSubmit =
    customerName.trim().length >= 2 &&
    /.+@.+\..+/.test(customerEmail) &&
    customerPhone.trim().length >= 6;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-between gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  active
                    ? "bg-brand text-white"
                    : done
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`hidden text-sm sm:block ${
                  active ? "font-semibold text-slate-900" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              {n < STEPS.length && (
                <span className="mx-1 hidden h-px flex-1 bg-slate-200 sm:block" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Honeypot anti-spam : invisible et inaccessible aux humains, rempli par les robots */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Ne pas remplir ce champ</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Étape 1 : Prestation */}
      {step === 1 && (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {cat.name}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {cat.services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    className={`card p-4 text-left transition ${
                      serviceId === s.id
                        ? "border-brand ring-2 ring-brand"
                        : "hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        {s.name}
                      </span>
                      <span className="whitespace-nowrap font-bold text-brand">
                        {formatPrice(s.priceCents)}
                      </span>
                    </div>
                    {s.description && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Durée : {formatDuration(s.durationMin)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary"
              disabled={!canNext1}
              onClick={() => setStep(2)}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Étape 2 : Date & créneau */}
      {step === 2 && (
        <div className="space-y-6">
          {selectedService && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              Prestation :{" "}
              <span className="font-semibold text-slate-900">
                {selectedService.name}
              </span>{" "}
              · {formatDuration(selectedService.durationMin)} ·{" "}
              {formatPrice(selectedService.priceCents)}
            </div>
          )}
          <div>
            <label className="label" htmlFor="date">
              Choisissez une date
            </label>
            <input
              id="date"
              type="date"
              className="input max-w-xs"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                loadSlots(e.target.value);
              }}
            />
          </div>

          {date && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-slate-700">
                Créneaux disponibles le {formatIsoDateKeyFr(date)}
              </h4>
              {slotsLoading ? (
                <p className="text-sm text-slate-500">Chargement…</p>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => (
                    <button
                      key={slot.startUtc}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        selectedSlot?.startUtc === slot.startUtc
                          ? "border-brand bg-brand text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-brand"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  {slotsReason ?? "Aucun créneau disponible ce jour-là."}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(1)}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canNext2}
              onClick={() => setStep(3)}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Adresse & couverture */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="label" htmlFor="postalCode">
              Code postal du lieu d'intervention
            </label>
            <div className="flex max-w-sm gap-2">
              <input
                id="postalCode"
                type="text"
                inputMode="numeric"
                maxLength={5}
                className="input"
                placeholder="75001"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setCoverage(null);
                }}
              />
              <button
                type="button"
                className="btn-secondary whitespace-nowrap"
                onClick={checkPostalCode}
                disabled={coverageLoading}
              >
                {coverageLoading ? "..." : "Vérifier"}
              </button>
            </div>
            {coverage && (
              <p
                className={`mt-2 text-sm ${
                  coverage.covered ? "text-green-700" : "text-red-600"
                }`}
              >
                {coverage.covered
                  ? `Zone couverte : ${coverage.city} (${coverage.postalCode}).`
                  : "Désolé, nous n'intervenons pas dans cette zone."}
              </p>
            )}
          </div>

          {coverage?.covered && (
            <div>
              <label className="label" htmlFor="address">
                Adresse complète
              </label>
              <input
                id="address"
                type="text"
                className="input"
                placeholder="12 rue de la Paix"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(2)}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canNext3}
              onClick={() => setStep(4)}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Étape 4 : Coordonnées & véhicule */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Nom complet *
              </label>
              <input
                id="name"
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Téléphone *
              </label>
              <input
                id="phone"
                className="input"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="make">
                Marque du véhicule
              </label>
              <input
                id="make"
                className="input"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="model">
                Modèle
              </label>
              <input
                id="model"
                className="input"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="year">
                Année
              </label>
              <input
                id="year"
                type="number"
                className="input"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="plate">
                Immatriculation
              </label>
              <input
                id="plate"
                className="input"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">
                Informations complémentaires
              </label>
              <textarea
                id="notes"
                rows={3}
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <h4 className="font-semibold text-slate-900">Récapitulatif</h4>
            <ul className="mt-2 space-y-1">
              <li>Prestation : {selectedService?.name}</li>
              <li>
                Créneau : {date && formatIsoDateKeyFr(date)} à{" "}
                {selectedSlot?.label}
              </li>
              <li>
                Lieu : {address}, {coverage?.postalCode} {coverage?.city}
              </li>
              <li>Prix : {selectedService && formatPrice(selectedService.priceCents)}</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(3)}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Envoi…" : "Confirmer la réservation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
