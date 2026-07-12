"use client";

import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { siteConfig } from "@/lib/site";

type CoverageMapProps = {
  /** Rayon de couverture en mètres. */
  radiusMeters?: number;
};

/**
 * Carte OpenStreetMap avec un cercle représentant la zone d'intervention.
 * MVP : cercle autour du centre défini dans siteConfig (voir plan).
 */
export default function CoverageMap({
  radiusMeters = 15000,
}: CoverageMapProps) {
  const center: [number, number] = [
    siteConfig.mapCenter.lat,
    siteConfig.mapCenter.lng,
  ];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={false}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={center}
        radius={radiusMeters}
        pathOptions={{
          color: "#ea580c",
          fillColor: "#ea580c",
          fillOpacity: 0.15,
          weight: 2,
        }}
      >
        <Popup>
          Zone d'intervention approximative de {siteConfig.name}.
        </Popup>
      </Circle>
    </MapContainer>
  );
}
