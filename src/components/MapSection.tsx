"use client";

import dynamic from "next/dynamic";

// react-leaflet ne supporte pas le rendu côté serveur : chargement dynamique client only.
const CoverageMap = dynamic(() => import("./CoverageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
      Chargement de la carte…
    </div>
  ),
});

export function MapSection() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
      <CoverageMap />
    </div>
  );
}
