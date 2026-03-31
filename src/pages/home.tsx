import { useState, useCallback } from 'react';
import L from 'leaflet';
import { Maximize2, Layers, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeafletMap } from '@/components/map/leaflet-map';
import { DataPanel } from '@/components/map/data-panel';
import { GazetteerSearch } from '@/components/map/gazetteer-search';
import { CacheDialog } from '@/components/map/cache-dialog';
import { useMapStore } from '@/stores/map-store';
import { BASEMAPS } from '@/lib/basemaps';

export default function HomePage() {
  const [map, setMap] = useState<L.Map | null>(null);
  const { items, clusteringEnabled, setClusteringEnabled, basemap, setBasemap } = useMapStore();

  const fitToData = useCallback(() => {
    if (!map || items.length === 0) return;

    let bounds: L.LatLngBounds | null = null;

    items.forEach((item) => {
      if (item.type === 'point') {
        const pt = L.latLng(item.lat, item.lng);
        bounds = bounds ? bounds.extend(pt) : L.latLngBounds([pt, pt]);
      } else {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layer = L.geoJSON(item.geojson as any);
          const b = layer.getBounds();
          if (b.isValid()) bounds = bounds ? bounds.extend(b) : b;
        } catch {
          // skip items whose geometry is unparseable
        }
      }
    });

    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [map, items]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r bg-background overflow-y-auto">
        <DataPanel />
      </div>

      {/* ── Map area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <LeafletMap onMapReady={setMap} />

        {/* Gazetteer — top-left overlay */}
        <div className="absolute top-3 left-3 z-[999]">
          <GazetteerSearch map={map} />
        </div>

        {/* Map toolbar — bottom-right overlay */}
        <div className="absolute bottom-4 right-4 z-[999] flex gap-2">
          {/* Basemap switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="shadow-md">
                <Map className="w-3.5 h-3.5 mr-1.5" />
                {BASEMAPS.find((b) => b.id === basemap)?.label ?? 'Map'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuRadioGroup value={basemap} onValueChange={(v) => setBasemap(v as typeof basemap)}>
                {BASEMAPS.map((b) => (
                  <DropdownMenuRadioItem key={b.id} value={b.id} className="text-sm">
                    {b.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <CacheDialog />

          <Button
            size="sm"
            variant={clusteringEnabled ? 'default' : 'secondary'}
            className="shadow-md"
            onClick={() => setClusteringEnabled(!clusteringEnabled)}
            title={clusteringEnabled ? 'Disable point clustering' : 'Enable point clustering'}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Cluster {clusteringEnabled ? 'on' : 'off'}
          </Button>

          {items.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="shadow-md"
              onClick={fitToData}
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
              Fit to Data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}