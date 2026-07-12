import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Le store est un Map au niveau module (partagé) : on utilise des clés uniques
// par test pour éviter les interférences.

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("autorise sous la limite puis bloque", () => {
    const key = "test-basic";
    expect(rateLimit(key, 3, 1000).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000).allowed).toBe(true);

    const blocked = rateLimit(key, 3, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("réautorise après expiration de la fenêtre", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    const key = "test-window";

    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1001); // au-delà de la fenêtre
    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
  });

  it("traite les clés distinctes indépendamment", () => {
    expect(rateLimit("test-a", 1, 1000).allowed).toBe(true);
    expect(rateLimit("test-a", 1, 1000).allowed).toBe(false);
    expect(rateLimit("test-b", 1, 1000).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prend la première valeur de x-forwarded-for", () => {
    const req = new Request("https://ex.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("retombe sur x-real-ip", () => {
    const req = new Request("https://ex.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("renvoie « unknown » sans en-tête", () => {
    const req = new Request("https://ex.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});
