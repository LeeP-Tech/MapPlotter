import { useEffect } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  GeoJSON as GeoJSONLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapStore } from '@/stores/map-store';
import type { PointItem, AreaItem } from '@/types/map-types';
import { getBasemap } from '@/lib/basemaps';

// ─── Clustered point layer ───────────────────────────────────────────────────

function ClusteredPoints({ items }: { items: PointItem[] }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 30 : count < 100 ? 36 : 44;
        const bg =
          count < 10
            ? 'rgba(59,130,246,0.88)'
            : count < 100
            ? 'rgba(245,158,11,0.88)'
            : 'rgba(239,68,68,0.88)';
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size < 36 ? 12 : 13}px;color:#fff;font-family:system-ui,sans-serif">${count}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    for (const item of items) {
      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${item.color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([item.lat, item.lng], { icon })
        .bindTooltip(item.label, { sticky: true })
        .addTo(clusterGroup);
    }

    map.addLayer(clusterGroup);
    return () => { map.removeLayer(clusterGroup); };
  }, [map, items]);

  return null;
}

// ─── Map instance provider ───────────────────────────────────────────────────

function MapInstanceProvider({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ─── Public component ────────────────────────────────────────────────────────

type LeafletMapProps = {
  onMapReady?: (map: L.Map) => void;
};

export function LeafletMap({ onMapReady }: LeafletMapProps) {
  const { items, clusteringEnabled, basemap } = useMapStore();
  const tile = getBasemap(basemap);

  const points = items.filter((i): i is PointItem => i.type === 'point' && i.visible !== false);
  const areas = items.filter((i): i is AreaItem => i.type === 'area' && i.visible !== false);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full"
      style={{ zIndex: 0 }}
      zoomControl={false}
    >
      <ZoomControl position="bottomleft" />
      <TileLayer
        key={tile.id}
        attribution={tile.attribution}
        url={tile.url}
        maxZoom={tile.maxZoom}
      />

      {onMapReady && <MapInstanceProvider onReady={onMapReady} />}

      {/* Points — clustered or plain circles */}
      {clusteringEnabled ? (
        <ClusteredPoints items={points} />
      ) : (
        points.map((item) => (
          <CircleMarker
            key={item.id}
            center={[item.lat, item.lng]}
            radius={8}
            pathOptions={{ color: item.color, fillColor: item.color, fillOpacity: 0.85, weight: 2 }}
          >
            <Tooltip sticky>{item.label}</Tooltip>
          </CircleMarker>
        ))
      )}

      {/* Area polygons — never clustered */}
      {areas.map((area) => (
        <GeoJSONLayer
          key={area.id + area.color}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={area.geojson as any}
          style={{ color: area.color, fillColor: area.color, fillOpacity: 0.35, weight: 2 }}
        >
          <Tooltip sticky>{area.label}</Tooltip>
        </GeoJSONLayer>
      ))}
    </MapContainer>
  );
}
