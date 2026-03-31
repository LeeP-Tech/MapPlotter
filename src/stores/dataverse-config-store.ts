import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColumnMapping } from '@/lib/dataverse';

interface DataverseConfigStore {
  mapping: ColumnMapping;
  setMapping: (patch: Partial<ColumnMapping>) => void;
  reset: () => void;
}

const DEFAULT_MAPPING: ColumnMapping = {
  tableName: '',
  dataMode: 'coordinates',
  latColumn: 'cr123_latitude',
  lngColumn: 'cr123_longitude',
  geocodeColumn: 'cr123_postcode',
  labelColumn: 'cr123_name',
  filter: '',
  maxRows: 500,
  writeBack: undefined,
};

export const useDataverseConfigStore = create<DataverseConfigStore>()(
  persist(
    (set) => ({
      mapping: { ...DEFAULT_MAPPING },
      setMapping: (patch) =>
        set((state) => ({ mapping: { ...state.mapping, ...patch } })),
      reset: () => set({ mapping: { ...DEFAULT_MAPPING } }),
    }),
    {
      name: 'map-plotter-dataverse-config',
    },
  ),
);
