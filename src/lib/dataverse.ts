/**
 * Dataverse integration via the @microsoft/power-apps SDK.
 *
 * DATA MODES
 * ──────────
 * 'coordinates'   — table already has lat/lng decimal columns. Fastest, no geocoding.
 * 'address'       — table has a free-text address column. Each row geocoded via OSM Nominatim.
 * 'postcode-point'— table has a postcode column. Plotted as a single point per row.
 *                   UK postcodes use postcodes.io (fast); others use Nominatim.
 * 'postcode-area' — table has a postcode/place-name column. Fetches a boundary polygon per row.
 *
 * WRITE-BACK (optional)
 * ──────────────────────
 * After geocoding an address or postcode to lat/lng, the app can write those
 * coordinates back to Dataverse so future loads can use 'coordinates' mode
 * (no re-geocoding, instant).  Requires write permission and knowledge of the
 * table's primary-key column name.
 *
 * LOCAL DEVELOPMENT
 * ─────────────────
 * When running with `npm run dev` the Power Apps bridge is absent; any SDK
 * call throws. Functions catch this and return descriptive errors.
 */

import { getClient } from '@microsoft/power-apps/data';
import { geocodeAddress, geocodePoint, fetchBoundary } from '@/lib/geocoding';
import type { MapItem } from '@/types/map-types';

// ─── Runtime detection ───────────────────────────────────────────────────────

export function isRunningInPowerApps(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (
    typeof w.__powerAppsHostConfig !== 'undefined' ||
    typeof w.__powerAppsBridge !== 'undefined' ||
    typeof w.PowerAppsDataBridge !== 'undefined'
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type DataMode =
  | 'coordinates'     // lat/lng stored directly
  | 'address'         // free-text address → geocode to point
  | 'postcode-point'  // postcode → centroid point
  | 'postcode-area';  // postcode/place → boundary polygon

export type WriteBackConfig = {
  /** Primary key column, e.g. "cr123_locationsid". Found in table Settings → Columns. */
  primaryKeyColumn: string;
  /** Decimal column to write latitude into. */
  latColumn: string;
  /** Decimal column to write longitude into. */
  lngColumn: string;
};

export type ColumnMapping = {
  tableName: string;
  dataMode: DataMode;
  /** Used when dataMode === 'coordinates' */
  latColumn: string;
  lngColumn: string;
  /** Used for geocoding modes (address / postcode-point / postcode-area) */
  geocodeColumn: string;
  labelColumn: string;
  filter?: string;
  maxRows?: number;
  writeBack?: WriteBackConfig;
};

export type GeocodingProgress = {
  processed: number;
  total: number;
  currentLabel: string;
  failed: number;
  /** Estimated seconds remaining (Nominatim-rate-limited modes only) */
  etaSeconds?: number;
};

export type LoadResult =
  | { ok: true; count: number; failed?: number }
  | { ok: false; error: string };

type RawRecord = Record<string, unknown>;

// ─── Main loader ─────────────────────────────────────────────────────────────

/**
 * Load rows from a Dataverse table and add them to the map as points or areas.
 *
 * @param mapping     Column configuration and data mode.
 * @param addItem     Map store's addItem action.
 * @param color       Hex colour string for the layer.
 * @param onProgress  Optional callback called after each geocoded row.
 */
export async function loadFromDataverse(
  mapping: ColumnMapping,
  addItem: (item: MapItem) => void,
  color: string,
  onProgress?: (p: GeocodingProgress) => void,
): Promise<LoadResult> {
  const client = getClient({});

  const {
    tableName, dataMode, latColumn, lngColumn, geocodeColumn, labelColumn,
    filter, maxRows = 500, writeBack,
  } = mapping;

  // Build $select list
  const selectCols: string[] = [labelColumn];
  if (dataMode === 'coordinates') {
    if (latColumn) selectCols.push(latColumn);
    if (lngColumn) selectCols.push(lngColumn);
  } else {
    if (geocodeColumn) selectCols.push(geocodeColumn);
  }
  if (writeBack?.primaryKeyColumn) selectCols.push(writeBack.primaryKeyColumn);
  const select = Array.from(new Set(selectCols.filter(Boolean)));

  // ── Fetch rows ────────────────────────────────────────────────────────────
  let records: RawRecord[];
  try {
    const result = await client.retrieveMultipleRecordsAsync<RawRecord>(tableName, {
      select,
      filter: filter || undefined,
      top: Math.min(maxRows, 5000),
    });
    if (!result.success) {
      return { ok: false, error: result.error?.message ?? 'Query failed.' };
    }
    records = result.data ?? [];
  } catch (err) {
    if (!isRunningInPowerApps()) {
      return {
        ok: false,
        error:
          'Not connected to Power Apps. Open this app in Power Apps Studio, ' +
          'add your Dataverse table as a datasource, then republish.',
      };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Query failed.' };
  }

  if (records.length === 0) {
    return { ok: false, error: 'No records returned. Check your table name and filter.' };
  }

  // ── Direct coordinates — fast path ────────────────────────────────────────
  if (dataMode === 'coordinates') {
    let plotted = 0;
    for (const row of records) {
      const lat = parseFloat(String(row[latColumn] ?? ''));
      const lng = parseFloat(String(row[lngColumn] ?? ''));
      const label = String(row[labelColumn] ?? `Row ${plotted + 1}`);
      if (isNaN(lat) || isNaN(lng)) continue;
      addItem({ id: crypto.randomUUID(), type: 'point', label, lat, lng, color });
      plotted++;
    }
    return { ok: true, count: plotted };
  }

  // ── Geocoding modes — row by row ──────────────────────────────────────────
  // Estimate rate: Nominatim = ~1.1 s/row; postcodes.io = ~0.1 s/row (no limit)
  const etaRate = (dataMode === 'postcode-point') ? 0.1 : 1.1;

  let plotted = 0;
  let failed = 0;
  const total = records.length;

  for (let i = 0; i < total; i++) {
    const row = records[i];
    const label = String(row[labelColumn] ?? `Row ${i + 1}`);
    const queryValue = String(row[geocodeColumn] ?? '').trim();

    const eta = Math.round((total - i) * etaRate);
    onProgress?.({ processed: i, total, currentLabel: label, failed, etaSeconds: eta });

    if (!queryValue) { failed++; continue; }

    try {
      if (dataMode === 'address') {
        const pt = await geocodeAddress(queryValue);
        addItem({ id: crypto.randomUUID(), type: 'point', label, lat: pt.lat, lng: pt.lng, color });
        await _maybeWriteBack(client, tableName, row, pt.lat, pt.lng, writeBack);
        plotted++;

      } else if (dataMode === 'postcode-point') {
        const pt = await geocodePoint(queryValue);
        addItem({ id: crypto.randomUUID(), type: 'point', label, lat: pt.lat, lng: pt.lng, color });
        await _maybeWriteBack(client, tableName, row, pt.lat, pt.lng, writeBack);
        plotted++;

      } else if (dataMode === 'postcode-area') {
        const boundary = await fetchBoundary(queryValue);
        addItem({ id: crypto.randomUUID(), type: 'area', label, geojson: boundary.geojson, color });
        plotted++;
      }
    } catch {
      failed++;
    }
  }

  onProgress?.({ processed: total, total, currentLabel: '', failed, etaSeconds: 0 });
  return { ok: true, count: plotted, failed: failed > 0 ? failed : undefined };
}

// ─── Write-back helper ────────────────────────────────────────────────────────

async function _maybeWriteBack(
  client: ReturnType<typeof getClient>,
  tableName: string,
  row: RawRecord,
  lat: number,
  lng: number,
  writeBack?: WriteBackConfig,
) {
  if (!writeBack?.primaryKeyColumn || !writeBack.latColumn || !writeBack.lngColumn) return;
  const recordId = String(row[writeBack.primaryKeyColumn] ?? '').trim();
  if (!recordId) return;
  try {
    await client.updateRecordAsync(tableName, recordId, {
      [writeBack.latColumn]: lat,
      [writeBack.lngColumn]: lng,
    });
  } catch {
    // Write-back is best-effort; don't fail the whole load
  }
}


