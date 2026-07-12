import { z } from "zod";

const isoDateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (attendu YYYY-MM-DD)");

/** Schéma de création d'une réservation (POST /api/bookings). */
export const bookingCreateSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  startUtc: z.string().datetime({ message: "Créneau invalide" }),

  customerName: z.string().trim().min(2, "Nom requis").max(120),
  customerEmail: z.string().trim().email("Email invalide").max(160),
  customerPhone: z
    .string()
    .trim()
    .min(6, "Téléphone requis")
    .max(30),

  vehicleMake: z.string().trim().max(60).optional().or(z.literal("")),
  vehicleModel: z.string().trim().max(60).optional().or(z.literal("")),
  vehicleYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(2100)
    .optional()
    .or(z.literal("")),
  vehiclePlate: z.string().trim().max(20).optional().or(z.literal("")),

  address: z.string().trim().min(4, "Adresse requise").max(200),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide"),
  city: z.string().trim().min(2, "Ville requise").max(120),

  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

/** Schéma de connexion admin. */
export const loginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

/** Schéma d'édition d'une catégorie. */
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug invalide (a-z, 0-9, tirets)")
    .max(80),
  order: z.coerce.number().int().min(0).default(0),
});

/** Schéma d'édition d'une prestation. Prix saisi en euros -> converti en centimes ailleurs. */
export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  priceEuros: z.coerce.number().min(0, "Prix invalide"),
  durationMin: z.coerce.number().int().min(5).max(600),
  categoryId: z.coerce.number().int().positive("Catégorie requise"),
  isActive: z.coerce.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

/** Schéma d'un créneau horaire hebdomadaire. */
export const workingHoursSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide"),
    isActive: z.coerce.boolean().default(true),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "L'heure de fin doit être après le début",
    path: ["endTime"],
  });

/** Schéma des paramètres de réservation. */
export const bookingSettingsSchema = z.object({
  slotStepMin: z.coerce.number().int().min(5).max(240),
  bufferMin: z.coerce.number().int().min(0).max(240),
  minLeadHours: z.coerce.number().int().min(0).max(720),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
});

/** Schéma d'une zone de couverture. */
export const coverageZoneSchema = z.object({
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide"),
  city: z.string().trim().min(1, "Ville requise").max(120),
  isActive: z.coerce.boolean().default(true),
});

/** Schéma d'un jour bloqué. */
export const blockedDateSchema = z.object({
  date: isoDateKey,
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});
