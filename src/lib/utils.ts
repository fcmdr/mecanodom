import { clsx, type ClassValue } from "clsx";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";

export const TIME_ZONE = "Europe/Paris";

/** Combine des classes Tailwind conditionnelles. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Formate un prix stocké en centimes vers une chaîne en euros (ex: 4990 -> "49,90 €"). */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Formate une durée en minutes vers une chaîne lisible (ex: 90 -> "1 h 30"). */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/** Formate une date UTC en date lisible fr (fuseau Europe/Paris). */
export function formatDateFr(date: Date | string): string {
  return formatInTimeZone(new Date(date), TIME_ZONE, "EEEE d MMMM yyyy", {
    locale: fr,
  });
}

/** Formate une date UTC en heure lisible (ex: "14:30"). */
export function formatTimeFr(date: Date | string): string {
  return formatInTimeZone(new Date(date), TIME_ZONE, "HH:mm", { locale: fr });
}

/** Formate une date+heure complète (ex: "lundi 5 mai 2025 à 14:30"). */
export function formatDateTimeFr(date: Date | string): string {
  return formatInTimeZone(
    new Date(date),
    TIME_ZONE,
    "EEEE d MMMM yyyy 'à' HH:mm",
    { locale: fr },
  );
}

/** Convertit une clé de date ISO "YYYY-MM-DD" vers un libellé lisible. */
export function formatIsoDateKeyFr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return formatInTimeZone(date, TIME_ZONE, "EEEE d MMMM yyyy", { locale: fr });
}

/** Libellés des statuts de réservation. */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
};

/** Libellés des jours de la semaine (index 0 = dimanche). */
export const WEEKDAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
