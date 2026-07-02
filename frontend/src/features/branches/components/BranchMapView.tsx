"use client";

import { useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n/routing";
import { hasGeo, localizeBranch, osmDirectionsUrl, type BranchDto } from "../types";

/**
 * Interactive Leaflet map ("use client" leaf) with OpenStreetMap tiles — no API
 * key required. Loaded via `next/dynamic({ ssr: false })` from BranchMap because
 * Leaflet touches `window`/`document` and cannot render on the server.
 *
 * Marker icon fix: instead of relying on Leaflet's default PNG icon (which 404s
 * under a bundler because its asset URLs are resolved relative to the CSS), we use
 * a self-contained inline-SVG `divIcon`. No external image, no network beyond tiles.
 */

/** Fallback map center (Riyadh) when no branch carries coordinates. */
const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

function createPinIcon() {
  return L.divIcon({
    className: "sf-branch-pin",
    html:
      '<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 12.16 24.63 12.68 25.27a1.7 1.7 0 0 0 2.64 0C15.84 38.63 28 23.5 28 14 28 6.27 21.73 0 14 0z" fill="#b91c1c"/>' +
      '<circle cx="14" cy="14" r="5.5" fill="#fff"/>' +
      "</svg>",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

/** Fits the viewport to all markers (or a sensible zoom for a single branch). */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const first = points[0];
    if (!first) return;
    if (points.length === 1) {
      map.setView(first, 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export default function BranchMapView({ branches }: { branches: BranchDto[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("branches");

  const icon = useMemo(() => createPinIcon(), []);
  const geoBranches = useMemo(() => branches.filter(hasGeo), [branches]);
  const points = useMemo<[number, number][]>(
    () => geoBranches.map((b) => [b.latitude, b.longitude]),
    [geoBranches],
  );
  const center = points[0] ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={points.length > 1 ? 6 : 13}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {geoBranches.map((branch) => {
        const { name, address } = localizeBranch(branch, locale);
        return (
          <Marker
            key={branch.id}
            position={[branch.latitude, branch.longitude]}
            icon={icon}
            title={name}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{name}</p>
                {address ? <p className="text-muted-foreground">{address}</p> : null}
                {branch.phone ? (
                  <p>
                    <a
                      className="underline"
                      href={`tel:${branch.phone.replace(/\s+/g, "")}`}
                    >
                      {branch.phone}
                    </a>
                  </p>
                ) : null}
                <p>
                  <a
                    className="underline"
                    href={osmDirectionsUrl(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("card.directions")}
                  </a>
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
