import { describe, expect, it } from "vitest";
import {
  bookingCreateSchema,
  bookingSettingsSchema,
  coverageZoneSchema,
  loginSchema,
  serviceSchema,
  workingHoursSchema,
} from "@/lib/validators";

const validBooking = {
  serviceId: 1,
  startUtc: "2026-07-20T06:00:00.000Z",
  customerName: "Jean Dupont",
  customerEmail: "jean@example.com",
  customerPhone: "0601020304",
  address: "12 rue de la Paix",
  postalCode: "75002",
  city: "Paris",
};

describe("bookingCreateSchema", () => {
  it("accepte un payload valide", () => {
    expect(bookingCreateSchema.safeParse(validBooking).success).toBe(true);
  });

  it("accepte les champs véhicule optionnels (« » et nombre)", () => {
    const res = bookingCreateSchema.safeParse({
      ...validBooking,
      vehicleMake: "",
      vehicleModel: "Clio",
      vehicleYear: 2015,
      vehiclePlate: "",
    });
    expect(res.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const res = bookingCreateSchema.safeParse({
      ...validBooking,
      customerEmail: "pas-un-email",
    });
    expect(res.success).toBe(false);
  });

  it("rejette un code postal ≠ 5 chiffres", () => {
    const res = bookingCreateSchema.safeParse({
      ...validBooking,
      postalCode: "750",
    });
    expect(res.success).toBe(false);
  });

  it("rejette un startUtc non-datetime", () => {
    const res = bookingCreateSchema.safeParse({
      ...validBooking,
      startUtc: "20 juillet",
    });
    expect(res.success).toBe(false);
  });

  it("rejette un nom manquant", () => {
    const { customerName, ...rest } = validBooking;
    void customerName;
    const res = bookingCreateSchema.safeParse(rest);
    expect(res.success).toBe(false);
  });
});

describe("serviceSchema", () => {
  it("coerce priceEuros et les bornes", () => {
    const res = serviceSchema.safeParse({
      name: "Vidange",
      priceEuros: "49.90",
      durationMin: "45",
      categoryId: "2",
      isActive: "true",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.priceEuros).toBeCloseTo(49.9);
      expect(res.data.durationMin).toBe(45);
      expect(res.data.categoryId).toBe(2);
      expect(res.data.isActive).toBe(true);
    }
  });

  it("rejette une durée hors bornes (5..600)", () => {
    expect(
      serviceSchema.safeParse({
        name: "X",
        priceEuros: 10,
        durationMin: 4,
        categoryId: 1,
      }).success,
    ).toBe(false);
    expect(
      serviceSchema.safeParse({
        name: "X",
        priceEuros: 10,
        durationMin: 601,
        categoryId: 1,
      }).success,
    ).toBe(false);
  });

  it("rejette un categoryId non positif", () => {
    expect(
      serviceSchema.safeParse({
        name: "X",
        priceEuros: 10,
        durationMin: 30,
        categoryId: 0,
      }).success,
    ).toBe(false);
  });
});

describe("workingHoursSchema", () => {
  it("accepte startTime < endTime", () => {
    expect(
      workingHoursSchema.safeParse({
        weekday: 1,
        startTime: "08:00",
        endTime: "12:00",
      }).success,
    ).toBe(true);
  });

  it("refuse startTime >= endTime avec path ['endTime']", () => {
    const res = workingHoursSchema.safeParse({
      weekday: 1,
      startTime: "12:00",
      endTime: "08:00",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].path).toEqual(["endTime"]);
    }
  });
});

describe("coverageZoneSchema", () => {
  it("accepte une zone valide", () => {
    expect(
      coverageZoneSchema.safeParse({ postalCode: "75001", city: "Paris" })
        .success,
    ).toBe(true);
  });
  it("rejette un code postal invalide", () => {
    expect(
      coverageZoneSchema.safeParse({ postalCode: "abcde", city: "Paris" })
        .success,
    ).toBe(false);
  });
});

describe("bookingSettingsSchema", () => {
  it("accepte des valeurs valides", () => {
    expect(
      bookingSettingsSchema.safeParse({
        slotStepMin: 30,
        bufferMin: 0,
        minLeadHours: 12,
        maxAdvanceDays: 30,
      }).success,
    ).toBe(true);
  });
  it("rejette maxAdvanceDays < 1", () => {
    expect(
      bookingSettingsSchema.safeParse({
        slotStepMin: 30,
        bufferMin: 0,
        minLeadHours: 12,
        maxAdvanceDays: 0,
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepte des identifiants valides", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
  });
  it("rejette un email invalide", () => {
    expect(
      loginSchema.safeParse({ email: "nope", password: "x" }).success,
    ).toBe(false);
  });
});
