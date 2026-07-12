"use client";

import { useState } from "react";
import type { CoverageResult } from "@/lib/coverage";

export function CoverageChecker() {
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const code = postalCode.replace(/\D/g, "");
    if (code.length !== 5) {
      setError("Entrez un code postal à 5 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/coverage?postalCode=${code}`);
      if (!res.ok) throw new Error("Erreur serveur");
      const data: CoverageResult = await res.json();
      setResult(data);
    } catch {
      setError("Impossible de vérifier la couverture. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Vérifier ma commune
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Entrez votre code postal pour savoir si nous intervenons chez vous.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="Ex : 75001"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          className="input flex-1"
          aria-label="Code postal"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : "Vérifier"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div
          className={`mt-4 rounded-lg p-4 text-sm ${
            result.covered
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result.covered ? (
            <p>
              <strong>Bonne nouvelle !</strong> Nous intervenons à{" "}
              {result.city} ({result.postalCode}).{" "}
              <a href="/rendez-vous" className="font-semibold underline">
                Prendre rendez-vous
              </a>
            </p>
          ) : (
            <p>
              Désolé, nous ne couvrons pas encore le {result.postalCode}.
              Contactez-nous pour vérifier les possibilités.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
