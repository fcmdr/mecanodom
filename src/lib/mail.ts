import "server-only";
import { Resend } from "resend";
import { formatDateTimeFr, formatPrice, formatDuration } from "./utils";
import { siteConfig } from "./site";

// Envoi d'e-mails via Resend. Dégradation propre : si RESEND_API_KEY est absent,
// les envois sont ignorés (log) sans jamais faire échouer la réservation.

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.MAIL_FROM || "MécanoDom <onboarding@resend.dev>";
const ADMIN_TO = process.env.MAIL_ADMIN;

export type BookingEmailData = {
  id: number;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  startAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  postalCode: string;
  city: string;
  vehicle?: string | null;
  notes?: string | null;
  /** Lien d'annulation client (optionnel). */
  cancelUrl?: string | null;
};

function cancelButton(url: string): string {
  return `<div style="margin:20px 0 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#fff;border:1px solid #cbd5e1;color:#334155;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
      Annuler mon rendez-vous
    </a>
  </div>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px;color:#64748b;font-size:14px;">${label}</td>
    <td style="padding:6px 12px;color:#0f172a;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

function detailsTable(b: BookingEmailData): string {
  return `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;">
    ${row("Référence", "#" + b.id)}
    ${row("Prestation", b.serviceName)}
    ${row("Date & heure", formatDateTimeFr(b.startAt))}
    ${row("Durée estimée", formatDuration(b.durationMin))}
    ${row("Adresse", `${b.address}, ${b.postalCode} ${b.city}`)}
    ${b.vehicle ? row("Véhicule", b.vehicle) : ""}
    ${row("Prix", formatPrice(b.priceCents))}
  </table>`;
}

function shell(title: string, intro: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <span style="font-size:18px;font-weight:800;">${siteConfig.name}</span>
      <span style="color:#fb923c;font-size:14px;"> — ${siteConfig.tagline}</span>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">${title}</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.5;">${intro}</p>
      ${inner}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">
      ${siteConfig.name} · ${siteConfig.phone} · ${siteConfig.email}
    </p>
  </div>
</body></html>`;
}

function clientHtml(b: BookingEmailData): string {
  const firstName = b.customerName.split(" ")[0];
  return shell(
    "Votre demande de rendez-vous est enregistrée",
    `Bonjour ${firstName}, merci pour votre demande. Elle est en cours de traitement : nous vous recontacterons rapidement pour la confirmer.`,
    `${detailsTable(b)}
     <p style="margin:20px 0 0;color:#475569;font-size:13px;">
       Une question ou un imprévu ? Contactez-nous au
       <a href="${siteConfig.phoneHref}" style="color:#ea580c;">${siteConfig.phone}</a>.
     </p>
     ${b.cancelUrl ? cancelButton(b.cancelUrl) : ""}`,
  );
}

function adminHtml(b: BookingEmailData): string {
  return shell(
    "Nouvelle demande de rendez-vous",
    `Une nouvelle réservation vient d'être créée (statut : en attente).`,
    `${detailsTable(b)}
     <table style="width:100%;border-collapse:collapse;margin-top:12px;">
       ${row("Client", b.customerName)}
       ${row("Téléphone", b.customerPhone)}
       ${row("Email", b.customerEmail)}
       ${b.notes ? row("Notes", b.notes) : ""}
     </table>`,
  );
}

function statusClientHtml(
  b: BookingEmailData,
  status: "CONFIRMED" | "CANCELLED",
): string {
  const firstName = b.customerName.split(" ")[0];
  if (status === "CONFIRMED") {
    return shell(
      "Votre rendez-vous est confirmé",
      `Bonjour ${firstName}, bonne nouvelle : votre rendez-vous est confirmé. Notre mécanicien interviendra à l'adresse et à l'horaire ci-dessous.`,
      `${detailsTable(b)}
       <p style="margin:20px 0 0;color:#475569;font-size:13px;">
         Merci de préparer l'accès au véhicule. Pour toute modification, appelez-nous au
         <a href="${siteConfig.phoneHref}" style="color:#ea580c;">${siteConfig.phone}</a>.
       </p>
       ${b.cancelUrl ? cancelButton(b.cancelUrl) : ""}`,
    );
  }
  return shell(
    "Votre rendez-vous a été annulé",
    `Bonjour ${firstName}, votre rendez-vous ci-dessous a été annulé. Si vous le souhaitez, vous pouvez reprogrammer une intervention à tout moment.`,
    `${detailsTable(b)}
     <p style="margin:20px 0 0;color:#475569;font-size:13px;">
       Pour reprendre rendez-vous, rendez-vous sur notre site ou appelez le
       <a href="${siteConfig.phoneHref}" style="color:#ea580c;">${siteConfig.phone}</a>.
     </p>`,
  );
}

/**
 * Notifie le client d'un changement de statut (confirmé / annulé).
 * Ne lève jamais : toute erreur est journalisée.
 */
export async function sendStatusChangeEmail(
  b: BookingEmailData,
  status: "CONFIRMED" | "CANCELLED",
): Promise<void> {
  if (!resend) {
    console.warn(
      "[mail] RESEND_API_KEY absent : e-mail de changement de statut désactivé.",
    );
    return;
  }

  const subject =
    status === "CONFIRMED"
      ? `Rendez-vous confirmé #${b.id} — ${siteConfig.name}`
      : `Rendez-vous annulé #${b.id} — ${siteConfig.name}`;

  try {
    const res = await resend.emails.send({
      from: FROM,
      to: b.customerEmail,
      subject,
      html: statusClientHtml(b, status),
    });
    if (res.error) console.error("[mail] Erreur Resend (statut):", res.error);
  } catch (err) {
    console.error("[mail] Échec e-mail de statut:", err);
  }
}

function clientCancelAdminHtml(b: BookingEmailData): string {
  return shell(
    "Annulation par le client",
    `Le client a annulé sa réservation depuis le lien reçu par e-mail. Le créneau est de nouveau disponible.`,
    `${detailsTable(b)}
     <table style="width:100%;border-collapse:collapse;margin-top:12px;">
       ${row("Client", b.customerName)}
       ${row("Téléphone", b.customerPhone)}
       ${row("Email", b.customerEmail)}
     </table>`,
  );
}

/**
 * Notifie le mécanicien qu'un client a annulé lui-même son rendez-vous.
 * Ne lève jamais.
 */
export async function sendClientCancellationAdminNotice(
  b: BookingEmailData,
): Promise<void> {
  if (!resend || !ADMIN_TO) return;
  try {
    const res = await resend.emails.send({
      from: FROM,
      to: ADMIN_TO,
      replyTo: b.customerEmail,
      subject: `Annulation client — RDV #${b.id} (${b.serviceName})`,
      html: clientCancelAdminHtml(b),
    });
    if (res.error) console.error("[mail] Erreur Resend (annul. admin):", res.error);
  } catch (err) {
    console.error("[mail] Échec notice annulation admin:", err);
  }
}

/**
 * Envoie les e-mails de réservation (confirmation client + alerte mécanicien).
 * Ne lève jamais : toute erreur est journalisée pour ne pas bloquer la réservation.
 */
export async function sendBookingEmails(b: BookingEmailData): Promise<void> {
  if (!resend) {
    console.warn(
      "[mail] RESEND_API_KEY absent : e-mails de réservation désactivés.",
    );
    return;
  }

  const jobs: Promise<unknown>[] = [];

  // Confirmation client
  jobs.push(
    resend.emails.send({
      from: FROM,
      to: b.customerEmail,
      subject: `Votre demande de rendez-vous #${b.id} — ${siteConfig.name}`,
      html: clientHtml(b),
    }),
  );

  // Alerte mécanicien
  if (ADMIN_TO) {
    jobs.push(
      resend.emails.send({
        from: FROM,
        to: ADMIN_TO,
        replyTo: b.customerEmail,
        subject: `Nouvelle réservation #${b.id} — ${b.serviceName}`,
        html: adminHtml(b),
      }),
    );
  } else {
    console.warn("[mail] MAIL_ADMIN absent : alerte mécanicien non envoyée.");
  }

  const results = await Promise.allSettled(jobs);
  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error("[mail] Échec d'envoi:", r.reason);
    } else if (
      r.value &&
      typeof r.value === "object" &&
      "error" in r.value &&
      r.value.error
    ) {
      console.error("[mail] Erreur Resend:", r.value.error);
    }
  });
}
