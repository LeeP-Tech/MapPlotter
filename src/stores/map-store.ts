import { create } from 'zustand';
import type { MapItem } from '@/types/map-types';
import type { BasemapId } from '@/lib/basemaps';
import { DEFAULT_BASEMAP_ID } from '@/lib/basemaps';

interface MapStore {
  items: MapItem[];
  clusteringEnabled: boolean;
  basemap: BasemapId;
  addItem: (item: MapItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  setClusteringEnabled: (enabled: boolean) => void;
  setBasemap: (id: BasemapId) => void;
  toggleItemVisibility: (id: string) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  items: [],
  clusteringEnabled: true,
  basemap: DEFAULT_BASEMAP_ID,
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearItems: () => set({ items: [] }),
  setClusteringEnabled: (enabled) => set({ clusteringEnabled: enabled }),
  setBasemap: (id) => set({ basemap: id }),
  toggleItemVisibility: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, visible: item.visible === false ? true : false } : item
      ),
    })),
}));
