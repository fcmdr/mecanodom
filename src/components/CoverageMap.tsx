"use client";

import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type CoverageMapProps = {
  /** Centre de la carte [lat, lng] (fourni par le composant serveur parent). */
  center: [number, number];
  /** Nom du tenant, affiché dans la popup. */
  siteName: string;
  /** Rayon de couverture en mètres. */
  radiusMeters?: number;
};

/**
 * Carte OpenStreetMap avec un cercle représentant la zone d'intervention.
 * Le centre et le nom proviennent du tenant (props), pas d'une config statique.
 */
export default function CoverageMap({
  center,
  siteName,
  radiusMeters = 15000,
}: CoverageMapProps) {

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
          Zone d'intervention approximative de {siteName}.
        </Popup>
      </Circle>
    </MapContainer>
  );
}
