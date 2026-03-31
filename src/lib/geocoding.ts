import { cachedJsonFetch, NOMINATIM_TTL_MS, POSTCODE_TTL_MS } from '@/lib/api-cache';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Respect Nominatim's usage policy: max 1 request per second.
let lastRequestTime = 0;
async function nominatimFetch(url: string): Promise<Response> {
  const wait = 1100 - (Date.now() - lastRequestTime);
  if (wait > 0) await new Promise<void>((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Nominatim request failed (HTTP ${response.status})`);
  return response;
}

// ─── UK postcode helpers ─────────────────────────────────────────────────────

/** Matches a full UK postcode, e.g. "SW1A 1AA" or "SW1A1AA" */
const UK_FULL_POSTCODE_RE = /^([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})$/i;
/** Matches a UK outward code (district) only, e.g. "SW1A" or "EC1A" */
const UK_OUTWARD_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/i;

type PostcodesIoResult = { latitude: number; longitude: number };

async function postcodeIoFetch(path: string): Promise<PostcodesIoResult> {
  const url = `https://api.postcodes.io/${path}`;
  const json = await cachedJsonFetch<{ result: PostcodesIoResult | null }>(
    url,
    async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Postcode not found.`);
      return res.json();
    },
    `Postcode: ${decodeURIComponent(path)}`,
    POSTCODE_TTL_MS,
  );
  if (!json.result) throw new Error(`Postcode not found.`);
  return json.result;
}

/**
 * Generate an approximate GeoJSON circle polygon around a lat/lng point.
 * @param lat   Centre latitude
 * @param lng   Centre longitude
 * @param radiusM  Radius in metres
 * @param numPts   Number of vertices (default 64)
 */
function circlePolygonGeoJSON(lat: number, lng: number, radiusM: number, numPts = 64): object {
  const R = 6371000; // Earth radius in metres
  const latRad = (lat * Math.PI) / 180;
  const coords: [number, number][] = [];

  for (let i = 0; i <= numPts; i++) {
    const angle = (2 * Math.PI * i) / numPts;
    const dLat = (radiusM / R) * (180 / Math.PI) * Math.cos(angle);
    const dLng = (radiusM / R) * (180 / Math.PI) * Math.sin(angle) / Math.cos(latRad);
    coords.push([lng + dLng, lat + dLat]); // GeoJSON [lng, lat]
  }
  // Ensure ring is closed
  coords[coords.length - 1] = [coords[0][0], coords[0][1]];

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}

/**
 * Detect axis-aligned bounding-box rectangles that Nominatim synthesises
 * when no real polygon exists in OSM (exactly 5 points, all right angles).
 */
function isBoundingBoxPolygon(coords: number[][][]): boolean {
  if (!coords || coords.length === 0) return false;
  const ring = coords[0];
  if (ring.length !== 5) return false;
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const uniqueLngs = new Set(lngs.map((v) => v.toFixed(7))).size;
  const uniqueLats = new Set(lats.map((v) => v.toFixed(7))).size;
  // A bbox rectangle has exactly 2 unique longitudes and 2 unique latitudes
  return uniqueLngs === 2 && uniqueLats === 2;
}

// ─── Point geocoding ────────────────────────────────────────────────────────

export type GeocodedPoint = {
  lat: number;
  lng: number;
  displayName: string;
};

/** Convert a free-text address to lat/lng using the Nominatim geocoding API. */
export async function geocodeAddress(address: string): Promise<GeocodedPoint> {
  const url =
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;
  const data = await cachedJsonFetch<{ lat: string; lon: string; display_name: string }[]>(
    url,
    async () => {
      const response = await nominatimFetch(url);
      return response.json();
    },
    `Address: ${address}`,
    NOMINATIM_TTL_MS,
  );

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Address not found. Try a more specific query.');
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

// ─── Unified point geocoder ────────────────────────────────────────────────────

/**
 * Geocode any address, postcode, or place name to a lat/lng point.
 * UK full postcodes / outward codes → postcodes.io (fast, no rate limit).
 * Everything else → Nominatim (1 req/sec rate limit applies).
 */
export async function geocodePoint(query: string): Promise<GeocodedPoint> {
  const trimmed = query.trim();

  const fullMatch = UK_FULL_POSTCODE_RE.exec(trimmed);
  if (fullMatch) {
    const normalised = `${fullMatch[1].toUpperCase()}${fullMatch[2].toUpperCase()}`;
    try {
      const r = await postcodeIoFetch(`postcodes/${encodeURIComponent(normalised)}`);
      return { lat: r.latitude, lng: r.longitude, displayName: trimmed.toUpperCase() };
    } catch { /* fall through to Nominatim */ }
  }

  if (UK_OUTWARD_RE.test(trimmed)) {
    try {
      const r = await postcodeIoFetch(`outcodes/${encodeURIComponent(trimmed.toUpperCase())}`);
      return { lat: r.latitude, lng: r.longitude, displayName: trimmed.toUpperCase() };
    } catch { /* fall through to Nominatim */ }
  }

  return geocodeAddress(trimmed);
}

// ─── Area boundary lookup ────────────────────────────────────────────────────

export type GeoBoundary = {
  /** A GeoJSON Feature with Polygon or MultiPolygon geometry. */
  geojson: object;
  displayName: string;
};

/** Fetch the boundary polygon for a postcode, city, or region name. */
export async function fetchBoundary(query: string): Promise<GeoBoundary> {
  const trimmed = query.trim();

  // ── UK full postcode (e.g. "SW1A 1AA") ────────────────────────────────────
  const fullMatch = UK_FULL_POSTCODE_RE.exec(trimmed);
  if (fullMatch) {
    const normalised = `${fullMatch[1].toUpperCase()}${fullMatch[2].toUpperCase()}`;
    const { latitude, longitude } = await postcodeIoFetch(`postcodes/${encodeURIComponent(normalised)}`);
    // Full postcodes cover ~50–200 m; use a 100 m circle
    return {
      geojson: circlePolygonGeoJSON(latitude, longitude, 100),
      displayName: trimmed.toUpperCase(),
    };
  }

  // ── UK outward code / district (e.g. "SW1A") ──────────────────────────────
  if (UK_OUTWARD_RE.test(trimmed)) {
    const outcode = trimmed.toUpperCase();
    try {
      const { latitude, longitude } = await postcodeIoFetch(`outcodes/${encodeURIComponent(outcode)}`);
      // Outward codes cover roughly 1–3 km; use a 1 km circle
      return {
        geojson: circlePolygonGeoJSON(latitude, longitude, 1000),
        displayName: `${outcode} (district)`,
      };
    } catch {
      // Fall through to Nominatim if postcodes.io doesn't know it
    }
  }

  // ── Nominatim for everything else (US ZIP codes, cities, regions) ─────────
  const url =
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(trimmed)}&format=geojson&polygon_geojson=1&limit=1`;
  const data = await cachedJsonFetch<{
    features: Array<{
      type: 'Feature';
      geometry: { type: string; coordinates: unknown };
      properties: { display_name: string };
    }>;
  }>(
    url,
    async () => {
      const response = await nominatimFetch(url);
      return response.json();
    },
    `Boundary: ${trimmed}`,
    NOMINATIM_TTL_MS,
  );

  if (!data.features || data.features.length === 0) {
    throw new Error('Location not found. Try a different postcode or place name.');
  }

  const feature = data.features[0];

  if (feature.geometry.type === 'Point') {
    throw new Error(
      'No boundary polygon found for this location. Try adding it as a point instead.',
    );
  }

  // Catch bounding-box rectangles Nominatim synthesises for missing polygons
  if (
    feature.geometry.type === 'Polygon' &&
    isBoundingBoxPolygon(feature.geometry.coordinates as number[][][])
  ) {
    throw new Error(
      'Only an approximate bounding box was found, not a real boundary. ' +
      'Try a broader search term (e.g. a city or region name) or add this as a point instead.',
    );
  }

  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
    throw new Error(`Unexpected geometry type: ${feature.geometry.type}`);
  }

  return {
    geojson: feature,
    displayName: feature.properties.display_name,
  };
}

// ─── Gazetteer search ────────────────────────────────────────────────────────

export type GazetteerResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
};

/**
 * Search for places by name using Nominatim.
 * Results are cached for 24 hours and respect the 1 req/sec rate limit on cache miss.
 */
export async function searchGazetteer(query: string): Promise<GazetteerResult[]> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=7&addressdetails=0`;
  return cachedJsonFetch<GazetteerResult[]>(
    url,
    async () => {
      const response = await nominatimFetch(url);
      return response.json();
    },
    `Search: ${query}`,
    NOMINATIM_TTL_MS,
  );
}

// ─── Custom polygon parsing ──────────────────────────────────────────────────

/**
 * Parse a block of text where each line is "lat, lng" (or "lat lng") into a
 * GeoJSON Feature with a Polygon geometry.
 *
 * Coordinates are stored in GeoJSON order [longitude, latitude].
 */
export function parsePolygonCoords(text: string): object {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 3) {
    throw new Error('A polygon requires at least 3 coordinate pairs.');
  }

  const coords: [number, number][] = lines.map((line, i) => {
    const parts = line.replace(/\s+/g, ' ').replace(/[,\s]+/, ',').split(',');
    if (parts.length < 2) {
      throw new Error(`Invalid coordinate on line ${i + 1}: "${line}"`);
    }
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error(`Non-numeric values on line ${i + 1}: "${line}"`);
    }
    if (lat < -90 || lat > 90) throw new Error(`Latitude out of range on line ${i + 1} (${lat})`);
    if (lng < -180 || lng > 180)
      throw new Error(`Longitude out of range on line ${i + 1} (${lng})`);
    // GeoJSON uses [longitude, latitude]
    return [lng, lat];
  });

  // Close the ring if needed
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}
