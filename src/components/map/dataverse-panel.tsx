import { useState } from 'react';
import { Database, Loader2, RefreshCw, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/stores/map-store';
import { useDataverseConfigStore } from '@/stores/dataverse-config-store';
import { loadFromDataverse, isRunningInPowerApps } from '@/lib/dataverse';
import type { GeocodingProgress, DataMode } from '@/lib/dataverse';
import { ITEM_COLORS } from '@/types/map-types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtEta(secs: number) {
  if (secs < 60) return `~${secs} sec`;
  return `~${Math.ceil(secs / 60)} min`;
}

function isGeocodingMode(mode: DataMode) {
  return mode !== 'coordinates';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataversePanel() {
  const { addItem } = useMapStore();
  const { mapping, setMapping, reset } = useDataverseConfigStore();

  const [color, setColor] = useState<string>(ITEM_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<GeocodingProgress | null>(null);
  const [result, setResult] = useState<
    { ok: true; count: number; failed?: number } | { ok: false; error: string } | null
  >(null);
  const [showWriteBack, setShowWriteBack] = useState(false);

  const inPowerApps = isRunningInPowerApps();
  const geocoding = isGeocodingMode(mapping.dataMode);

  async function handleLoad(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setProgress(null);
    setLoading(true);
    try {
      const r = await loadFromDataverse(
        mapping,
        addItem,
        color,
        geocoding ? setProgress : undefined,
      );
      setResult(r);
      if (r.ok) {
        const idx = ITEM_COLORS.findIndex((c) => c === color);
        setColor(ITEM_COLORS[(idx + 1) % ITEM_COLORS.length]);
      }
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  const pct = progress ? Math.round((progress.processed / Math.max(progress.total, 1)) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Status banner ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-start gap-2 rounded-md px-3 py-2 text-xs leading-relaxed',
          inPowerApps
            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        )}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        {inPowerApps ? (
          <span>Connected to Power Apps. Configure below and load data.</span>
        ) : (
          <span>
            Running locally. In <strong>Power Apps Studio</strong>, add your table as a
            datasource then republish to enable queries.
          </span>
        )}
      </div>

      <Separator />

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form onSubmit={handleLoad} className="flex flex-col gap-3">

        {/* Data mode */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Data mode</Label>
          <Select
            value={mapping.dataMode}
            onValueChange={(v) => { setMapping({ dataMode: v as DataMode }); setResult(null); }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coordinates">Direct Coordinates (lat/lng columns)</SelectItem>
              <SelectItem value="address">Geocode Addresses (free-text address column)</SelectItem>
              <SelectItem value="postcode-point">Postcodes → Points</SelectItem>
              <SelectItem value="postcode-area">Postcodes → Area Boundaries</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {mapping.dataMode === 'coordinates' && 'Table has latitude & longitude decimal columns. Instant — no geocoding.'}
            {mapping.dataMode === 'address' && 'Table has a free-text address column. Geocoded via OpenStreetMap (~1 sec/row).'}
            {mapping.dataMode === 'postcode-point' && 'Table has a postcode column. UK postcodes use postcodes.io (fast). Others via OSM.'}
            {mapping.dataMode === 'postcode-area' && 'Table has a postcode/place column. Fetches a boundary polygon per row (~1 sec/row).'}
          </p>
        </div>

        {/* Table name */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Table logical name</Label>
          <Input
            placeholder="cr123_locations"
            value={mapping.tableName}
            onChange={(e) => setMapping({ tableName: e.target.value })}
            required
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Maker Portal → Tables → [your table] → Settings → Name
          </p>
        </div>

        {/* Label column (always) */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Label column</Label>
          <Input
            placeholder="cr123_name"
            value={mapping.labelColumn}
            onChange={(e) => setMapping({ labelColumn: e.target.value })}
            required
            className="font-mono text-xs"
          />
        </div>

        {/* Coordinate columns — only for 'coordinates' mode */}
        {mapping.dataMode === 'coordinates' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Latitude column</Label>
              <Input
                placeholder="cr123_latitude"
                value={mapping.latColumn}
                onChange={(e) => setMapping({ latColumn: e.target.value })}
                required
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Longitude column</Label>
              <Input
                placeholder="cr123_longitude"
                value={mapping.lngColumn}
                onChange={(e) => setMapping({ lngColumn: e.target.value })}
                required
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Geocode / postcode column — for non-coordinates modes */}
        {geocoding && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">
              {mapping.dataMode === 'address' ? 'Address column' : 'Postcode column'}
            </Label>
            <Input
              placeholder={mapping.dataMode === 'address' ? 'cr123_address' : 'cr123_postcode'}
              value={mapping.geocodeColumn}
              onChange={(e) => setMapping({ geocodeColumn: e.target.value })}
              required
              className="font-mono text-xs"
            />
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">OData filter <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            placeholder="statecode eq 0"
            value={mapping.filter ?? ''}
            onChange={(e) => setMapping({ filter: e.target.value })}
            className="font-mono text-xs"
          />
        </div>

        {/* Max rows */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Max rows</Label>
          <Input
            type="number"
            min={1}
            max={5000}
            value={mapping.maxRows ?? 500}
            onChange={(e) => setMapping({ maxRows: parseInt(e.target.value) || 500 })}
          />
          {geocoding && (
            <p className="text-[11px] text-muted-foreground">
              Estimated load time: {fmtEta(
                (mapping.dataMode === 'postcode-point' ? 0.1 : 1.1) * (mapping.maxRows ?? 500)
              )}
            </p>
          )}
        </div>

        {/* Write-back — only for point geocoding modes */}
        {(mapping.dataMode === 'address' || mapping.dataMode === 'postcode-point') && (
          <div className="rounded-md border">
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
              onClick={() => setShowWriteBack((v) => !v)}
            >
              {showWriteBack ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              Write back coordinates
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                {mapping.writeBack ? 'enabled' : 'off'}
              </span>
            </button>

            {showWriteBack && (
              <div className="px-3 pb-3 flex flex-col gap-2 border-t pt-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  After geocoding, save lat/lng back to your table. Next load use
                  <em> Direct Coordinates</em> mode for instant loading.
                </p>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Primary key column</Label>
                  <Input
                    placeholder="cr123_locationsid"
                    value={mapping.writeBack?.primaryKeyColumn ?? ''}
                    onChange={(e) =>
                      setMapping({
                        writeBack: {
                          primaryKeyColumn: e.target.value,
                          latColumn: mapping.writeBack?.latColumn ?? '',
                          lngColumn: mapping.writeBack?.lngColumn ?? '',
                        },
                      })
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Usually the table logical name + <code className="font-mono">id</code>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Write lat to</Label>
                    <Input
                      placeholder="cr123_latitude"
                      value={mapping.writeBack?.latColumn ?? ''}
                      onChange={(e) =>
                        setMapping({
                          writeBack: {
                            primaryKeyColumn: mapping.writeBack?.primaryKeyColumn ?? '',
                            latColumn: e.target.value,
                            lngColumn: mapping.writeBack?.lngColumn ?? '',
                          },
                        })
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Write lng to</Label>
                    <Input
                      placeholder="cr123_longitude"
                      value={mapping.writeBack?.lngColumn ?? ''}
                      onChange={(e) =>
                        setMapping({
                          writeBack: {
                            primaryKeyColumn: mapping.writeBack?.primaryKeyColumn ?? '',
                            latColumn: mapping.writeBack?.latColumn ?? '',
                            lngColumn: e.target.value,
                          },
                        })
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                {mapping.writeBack?.primaryKeyColumn && (
                  <button
                    type="button"
                    className="text-[11px] text-destructive hover:underline text-left"
                    onClick={() => setMapping({ writeBack: undefined })}
                  >
                    Disable write-back
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Color picker */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Layer color</Label>
          <div className="flex gap-1.5 mt-0.5">
            {ITEM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select color ${c}`}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                  color === c
                    ? 'border-foreground scale-110 ring-1 ring-foreground/30'
                    : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Progress bar — only during geocoding */}
        {loading && geocoding && progress && (
          <div className="flex flex-col gap-1.5">
            <Progress value={pct} className="h-1.5" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>
                {progress.processed}/{progress.total}
                {progress.currentLabel && ` — ${progress.currentLabel}`}
                {progress.failed > 0 && `, ${progress.failed} failed`}
              </span>
              {(progress.etaSeconds ?? 0) > 2 && (
                <span>{fmtEta(progress.etaSeconds!)} left</span>
              )}
            </div>
          </div>
        )}

        {/* Result feedback */}
        {result && !loading && (
          <div
            className={cn(
              'text-xs rounded-md px-3 py-2 leading-relaxed',
              result.ok
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-destructive/10 text-destructive',
            )}
          >
            {result.ok
              ? `✓ Loaded ${result.count} record${result.count !== 1 ? 's' : ''}${
                  result.failed ? ` (${result.failed} skipped — could not geocode)` : ''
                } onto the map.`
              : result.error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading || !mapping.tableName.trim()}
            size="sm"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5 mr-1.5" />
            )}
            {loading ? 'Loading…' : 'Load from Dataverse'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { reset(); setResult(null); setProgress(null); }}
            title="Reset column mapping"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
