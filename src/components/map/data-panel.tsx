import { useState } from 'react';
import { Trash2, MapPin, Square, Plus, Loader2, Database, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/stores/map-store';
import { geocodeAddress, fetchBoundary, parsePolygonCoords } from '@/lib/geocoding';
import { ITEM_COLORS } from '@/types/map-types';
import type { MapItem } from '@/types/map-types';
import { DataversePanel } from './dataverse-panel';
import { HelpDialog } from './help-dialog';

type MainType = 'point' | 'area';
type PointSubType = 'coordinates' | 'address';
type AreaSubType = 'postcode' | 'polygon';

export function DataPanel() {
  const { items, addItem, removeItem, clearItems, toggleItemVisibility } = useMapStore();

  // ── Form state ────────────────────────────────────────────────────────────
  const [mainType, setMainType] = useState<MainType>('point');
  const [pointSubType, setPointSubType] = useState<PointSubType>('coordinates');
  const [areaSubType, setAreaSubType] = useState<AreaSubType>('postcode');

  const [label, setLabel] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [polygonText, setPolygonText] = useState('');
  const [color, setColor] = useState<string>(ITEM_COLORS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function advanceColor(current: string) {
    const idx = ITEM_COLORS.findIndex((c) => c === current);
    return ITEM_COLORS[(idx + 1) % ITEM_COLORS.length];
  }

  function resetForm(usedColor: string) {
    setLabel('');
    setLat('');
    setLng('');
    setAddress('');
    setPostcode('');
    setPolygonText('');
    setError(null);
    setColor(advanceColor(usedColor));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let item: MapItem;

      if (mainType === 'point') {
        if (pointSubType === 'coordinates') {
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lng);
          if (isNaN(latNum) || isNaN(lngNum)) throw new Error('Enter valid latitude and longitude values.');
          if (latNum < -90 || latNum > 90) throw new Error('Latitude must be between −90 and 90.');
          if (lngNum < -180 || lngNum > 180) throw new Error('Longitude must be between −180 and 180.');
          item = {
            id: crypto.randomUUID(),
            type: 'point',
            label: label.trim() || `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`,
            lat: latNum,
            lng: lngNum,
            color,
          };
        } else {
          if (!address.trim()) throw new Error('Please enter an address.');
          const result = await geocodeAddress(address.trim());
          item = {
            id: crypto.randomUUID(),
            type: 'point',
            label: label.trim() || address.trim(),
            lat: result.lat,
            lng: result.lng,
            color,
          };
        }
      } else {
        if (areaSubType === 'postcode') {
          if (!postcode.trim()) throw new Error('Please enter a postcode or place name.');
          const result = await fetchBoundary(postcode.trim());
          item = {
            id: crypto.randomUUID(),
            type: 'area',
            label: label.trim() || postcode.trim().toUpperCase(),
            geojson: result.geojson,
            color,
          };
        } else {
          if (!polygonText.trim()) throw new Error('Please enter at least 3 coordinate pairs.');
          const geojson = parsePolygonCoords(polygonText);
          item = {
            id: crypto.randomUUID(),
            type: 'area',
            label: label.trim() || 'Custom Area',
            geojson,
            color,
          };
        }
      }

      addItem(item);
      resetForm(color);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Map Plotter</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add points and areas to the map
          </p>
        </div>
        <HelpDialog />
      </div>

      <Separator />

      {/* ── Tabs: Manual entry | Dataverse ──────────────────────────────── */}
      <Tabs defaultValue="manual" className="flex flex-col gap-3">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="manual" className="text-xs">
            <MapPin className="w-3 h-3 mr-1.5" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="dataverse" className="text-xs">
            <Database className="w-3 h-3 mr-1.5" />
            Dataverse
          </TabsTrigger>
        </TabsList>

        {/* ── Manual tab ──────────────────────────────────────────────────── */}
        <TabsContent value="manual" className="mt-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Type toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mainType === 'point' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => { setMainType('point'); setError(null); }}
          >
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Point
          </Button>
          <Button
            type="button"
            variant={mainType === 'area' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => { setMainType('area'); setError(null); }}
          >
            <Square className="w-3.5 h-3.5 mr-1.5" />
            Area
          </Button>
        </div>

        {/* Sub-type */}
        {mainType === 'point' ? (
          <Select
            value={pointSubType}
            onValueChange={(v) => setPointSubType(v as PointSubType)}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coordinates">Coordinates (Lat / Lng)</SelectItem>
              <SelectItem value="address">Address (Geocode via OSM)</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={areaSubType}
            onValueChange={(v) => setAreaSubType(v as AreaSubType)}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postcode">Postcode / Zipcode / City</SelectItem>
              <SelectItem value="polygon">Custom Polygon (Points)</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Dynamic fields */}
        {mainType === 'point' && pointSubType === 'coordinates' && (
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                placeholder="51.5074"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                step="any"
                min="-90"
                max="90"
                required
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                placeholder="-0.1278"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                step="any"
                min="-180"
                max="180"
                required
              />
            </div>
          </div>
        )}

        {mainType === 'point' && pointSubType === 'address' && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Address</Label>
            <Input
              placeholder="10 Downing Street, London"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        )}

        {mainType === 'area' && areaSubType === 'postcode' && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Postcode / Zipcode / City Name</Label>
            <Input
              placeholder="SW1A  or  SW1A 1AA  or  10001  or  Paris"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              UK full postcodes (e.g. SW1A&nbsp;1AA) and outward codes (e.g. SW1A) use
              the postcodes.io API and render as approximate circles. US ZIP codes and
              place names use OpenStreetMap boundaries.
            </p>
          </div>
        )}

        {mainType === 'area' && areaSubType === 'polygon' && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">
              Coordinates — one <code className="font-mono">lat, lng</code> per line
            </Label>
            <Textarea
              placeholder={"51.5060, -0.1300\n51.5090, -0.1250\n51.5090, -0.1350"}
              value={polygonText}
              onChange={(e) => setPolygonText(e.target.value)}
              className="font-mono text-xs h-28 resize-none"
              required
            />
          </div>
        )}

        {/* Label */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Label (optional)</Label>
          <Input
            placeholder="Custom label…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Color picker */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-1.5 mt-0.5">
            {ITEM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select color ${c}`}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                  color === c ? 'border-foreground scale-110 ring-1 ring-foreground/30' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 leading-relaxed">
            {error}
          </p>
        )}

        {/* Submit */}
        <Button type="submit" disabled={loading} size="sm" className="w-full">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5 mr-1.5" />
          )}
          {loading ? 'Adding…' : 'Add to Map'}
        </Button>
      </form>
        </TabsContent>

        {/* ── Dataverse tab ────────────────────────────────────────────────── */}
        <TabsContent value="dataverse" className="mt-0">
          <DataversePanel />
        </TabsContent>
      </Tabs>

      {/* ── Items list ─────────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {items.length} item{items.length !== 1 ? 's' : ''} on map
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={clearItems}
            >
              Clear all
            </Button>
          </div>

          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 group"
              >
                {/* Type indicator */}
                {item.type === 'point' ? (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-background shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 border border-background shadow-sm opacity-80"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                <span className={`flex-1 truncate text-xs ${item.visible === false ? 'opacity-40 line-through' : ''}`}>
                  {item.label}
                </span>

                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex-shrink-0">
                  {item.type}
                </span>

                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity focus:opacity-100"
                  onClick={() => toggleItemVisibility(item.id)}
                  aria-label={item.visible === false ? `Show ${item.label}` : `Hide ${item.label}`}
                  title={item.visible === false ? 'Show' : 'Hide'}
                >
                  {item.visible === false ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity focus:opacity-100"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.label}`}
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
