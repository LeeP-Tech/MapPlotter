export const ITEM_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
] as const;

/** A map point (single location). */
export type PointItem = {
  id: string;
  type: 'point';
  label: string;
  lat: number;
  lng: number;
  color: string;
  visible?: boolean;
};

/**
 * A map area (polygon or multi-polygon).
 * `geojson` is a GeoJSON Feature object with a Polygon or MultiPolygon geometry,
 * using standard GeoJSON coordinate order: [longitude, latitude].
 */
export type AreaItem = {
  id: string;
  type: 'area';
  label: string;
  geojson: object;
  color: string;
  visible?: boolean;
};

export type MapItem = PointItem | AreaItem;
