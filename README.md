# MapPlotter

[![CI](https://github.com/LeeP-Tech/MapPlotter/actions/workflows/ci.yml/badge.svg)](https://github.com/LeeP-Tech/MapPlotter/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Changelog](https://img.shields.io/badge/changelog-1.1.0-informational)](CHANGELOG.md)

A **Power Apps Code App** that plots geographic data on an interactive map. Add points and areas from coordinates, addresses, postcodes, or load them directly from a **Dataverse** table. Built with React, TypeScript, and Leaflet.

---

## Features

- **Multiple data types** — points (coordinates or geocoded addresses) and areas (postcode/city boundaries, custom polygons)
- **Dataverse integration** — connect a Dataverse table in four modes: raw coordinates, address geocoding, postcode points, and postcode area boundaries
- **Geocode write-back** — optionally resolve and persist lat/lng coordinates back to Dataverse
- **Smart UK postcode handling** — full postcodes and outward codes resolve via postcodes.io (no rate limit, no bounding-box rectangles)
- **Marker clustering** — overlapping points bundle into numbered circles at lower zoom levels
- **Five basemaps** — Streets (OSM), Satellite (Esri), Light (CartoDB), Dark (CartoDB), Terrain (Stadia/Stamen)
- **Gazetteer search** — fly to any place by name using a floating search bar
- **Layer visibility** — show/hide individual items from the sidebar
- **Dark / light theme** — respects OS preference, togglable in the UI
- **How-to guide** — built-in help dialog covering all data modes
- **API response cache** — Nominatim and postcodes.io responses are cached in browser local storage (24 h and 7 days respectively), with a built-in cache manager to inspect, delete, and clear entries

---

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` with hot-module reload. Outside of Power Apps the Dataverse tab is disabled; all manual entry and map features work in any browser.

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Lint

```bash
npm run lint
```

---

## Power Apps deployment

1. Build the app: `npm run build`
2. Publish the `dist/` folder as a **Power Apps Code Component** using the [Power Apps CLI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/get-powerapps-cli)

The app detects when it is running inside the Power Apps host via `window.__powerAppsBridge` and enables live Dataverse connectivity through the `@microsoft/power-apps` SDK. When run in a plain browser this bridge is absent and the Dataverse tab shows a prompt to open the app inside Power Apps.

---

## Architecture

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5 + Vite 7 |
| Map rendering | Leaflet 1.9 + react-leaflet 5 |
| Marker clustering | leaflet.markercluster 1.5 |
| State management | Zustand 5 |
| UI components | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Icons | Lucide React |
| Data fetching | TanStack Query 5 |
| Routing | React Router 7 |
| Power Apps SDK | @microsoft/power-apps |

---

## Data sources

The following external services are called at runtime. Review their terms before deploying to production at scale.

| Service | Purpose | Terms / Notes |
|---|---|---|
| [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) | Address geocoding; area boundary polygons; gazetteer search | [Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) — max 1 req/sec; responses cached 24 h; no bulk/automated use without your own instance |
| [postcodes.io](https://postcodes.io) | UK postcode geocoding | [MIT-licensed open API](https://github.com/ideal-postcodes/postcodes.io) — no rate limit; responses cached 7 days |
| [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) | Satellite basemap tiles | [Esri Master License Agreement](https://www.esri.com/en-us/legal/terms/full-master-agreement) |
| [CartoDB Basemaps](https://carto.com/basemaps/) | Light and Dark basemap tiles | [CARTO Terms of Service](https://carto.com/legal/) |
| [Stadia Maps / Stamen Terrain](https://stadiamaps.com/stamen/) | Terrain basemap tiles | [Stadia Maps Terms](https://stadiamaps.com/terms-of-service/); tiles © [Stamen Design](http://stamen.com) (CC BY 3.0), data © OpenStreetMap contributors |

---

## Third-party open-source licenses

This project depends on the following open-source packages. Full license texts are available in each package's repository or via `node_modules/<package>/LICENSE`.

| Package | Version | License |
|---|---|---|
| [React](https://react.dev) | 19 | MIT |
| [Vite](https://vitejs.dev) | 7 | MIT |
| [TypeScript](https://www.typescriptlang.org) | 5 | Apache 2.0 |
| [Leaflet](https://leafletjs.com) | 1.9 | BSD 2-Clause |
| [react-leaflet](https://react-leaflet.js.org) | 5 | MIT |
| [leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | 1.5 | MIT |
| [Zustand](https://github.com/pmndrs/zustand) | 5 | MIT |
| [TanStack Query](https://tanstack.com/query) | 5 | MIT |
| [TanStack Table](https://tanstack.com/table) | 8 | MIT |
| [Radix UI](https://www.radix-ui.com) | 1–2 | MIT |
| [shadcn/ui](https://ui.shadcn.com) | — | MIT |
| [Tailwind CSS](https://tailwindcss.com) | 4 | MIT |
| [Lucide React](https://lucide.dev) | — | ISC |
| [React Router](https://reactrouter.com) | 7 | MIT |
| [Recharts](https://recharts.org) | 2 | MIT |
| [Sonner](https://sonner.emilkowal.ski) | 2 | MIT |
| [class-variance-authority](https://cva.style) | — | Apache 2.0 |
| [clsx](https://github.com/lukeed/clsx) | — | MIT |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — | MIT |
| [date-fns](https://date-fns.org) | 4 | MIT |
| [cmdk](https://cmdk.paco.me) | — | MIT |
| [react-day-picker](https://daypicker.dev) | 9 | MIT |
| [@microsoft/power-apps SDK](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview) | 1 | [Microsoft Software License](https://www.npmjs.com/package/@microsoft/power-apps) |

---

## Known limitations

- **Nominatim rate limit** — address geocoding and boundary lookups are throttled to 1 request per second to comply with the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/). Responses are cached in local storage for 24 hours so repeated queries are instant and API-free. Loading large datasets from Dataverse (e.g. hundreds of addresses not yet cached) will still take time. For high-volume production use, consider running your own Nominatim instance.
- **Dataverse requires the Power Apps host** — the Dataverse tab is only functional when the app is deployed inside a Power Apps environment. In a plain browser the tab displays a prompt explaining this.
- **Tile provider terms** — the Esri Satellite basemap is subject to the [Esri Master License Agreement](https://www.esri.com/en-us/legal/terms/full-master-agreement). Review usage allowances before deploying commercially. CartoDB and Stadia are free within their standard usage tiers.
- **UK postcodes only for postcodes.io** — the smart postcode handling applies to UK postcodes only. Non-UK postal codes fall back to Nominatim.
- **No offline support** — all map tiles and geocoding require an active internet connection.

---

## Maintenance

See [PATCHING.md](PATCHING.md) for instructions on keeping dependencies patched and monitoring external API changes.

---

## License

Copyright 2026 Lee Pasifull

Licensed under the Apache License, Version 2.0 — see [LICENSE](LICENSE) for the full text.
