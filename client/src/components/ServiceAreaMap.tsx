import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker } from "react-leaflet";

type LatLng = { lat: number; lng: number };

type Props = {
  townCity?: string;
  postcode?: string;
  travelDistance?: string;
  className?: string;
};

const LONDON_CENTER: LatLng = { lat: 51.5074, lng: -0.1278 };

function parseMiles(travelDistance?: string): number | null {
  const raw = (travelDistance || "").toString().trim();
  const m = raw.match(/(\d+(\.\d+)?)/);
  const miles = m?.[1] ? Number(m[1]) : NaN;
  return Number.isFinite(miles) && miles > 0 ? miles : null;
}

function zoomForMiles(miles: number | null): number {
  if (!miles) return 11;
  if (miles <= 3) return 13;
  if (miles <= 7) return 12;
  if (miles <= 15) return 11;
  if (miles <= 30) return 10;
  return 9;
}

async function geocodeViaPostcodesIo(postcode: string, signal?: AbortSignal): Promise<LatLng | null> {
  const trimmed = postcode.trim();
  if (!trimmed) return null;

  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const lat = data?.result?.latitude;
  const lng = data?.result?.longitude;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  return null;
}

async function geocodeViaNominatim(query: string, signal?: AbortSignal): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as any[];
  const first = data?.[0];
  const lat = first?.lat ? Number(first.lat) : NaN;
  const lng = first?.lon ? Number(first.lon) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

export default function ServiceAreaMap({ townCity, postcode, travelDistance, className }: Props) {
  const miles = useMemo(() => parseMiles(travelDistance), [travelDistance]);
  const radiusMeters = miles ? miles * 1609.344 : 0;
  const zoom = useMemo(() => zoomForMiles(miles), [miles]);

  const [center, setCenter] = useState<LatLng>(LONDON_CENTER);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const pc = (postcode || "").trim();
    const city = (townCity || "").trim();
    if (!pc && !city) {
      setCenter(LONDON_CENTER);
      return;
    }

    const ac = new AbortController();
    setIsResolving(true);

    (async () => {
      try {
        // Prefer UK postcode precision when available
        const byPostcode = pc ? await geocodeViaPostcodesIo(pc, ac.signal) : null;
        if (byPostcode) {
          setCenter(byPostcode);
          return;
        }

        // Fallback: city search (bias to UK)
        const byCity = city ? await geocodeViaNominatim(`${city}, UK`, ac.signal) : null;
        setCenter(byCity || LONDON_CENTER);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setCenter(LONDON_CENTER);
      } finally {
        setIsResolving(false);
      }
    })();

    return () => ac.abort();
  }, [postcode, townCity]);

  return (
    <div className={`service-area-map ${className || ""}`.trim()}>
      <div className="service-area-map-inner" aria-label="Service area map">
        {/* key forces re-init on new centers (helps Leaflet re-center reliably) */}
        <MapContainer
          key={`${center.lat.toFixed(5)}:${center.lng.toFixed(5)}:${zoom}`}
          center={[center.lat, center.lng]}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: 220, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker center={[center.lat, center.lng]} radius={6} pathOptions={{ color: "#002f77", fillColor: "#002f77", fillOpacity: 1 }} />
          {radiusMeters > 0 && (
            <Circle
              center={[center.lat, center.lng]}
              radius={radiusMeters}
              pathOptions={{ color: "#002f77", fillColor: "#002f77", fillOpacity: 0.12 }}
            />
          )}
        </MapContainer>
      </div>

      {isResolving && <div className="service-area-map-hint">Finding location…</div>}
    </div>
  );
}


