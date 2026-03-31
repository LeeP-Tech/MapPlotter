# Changelog

All notable changes to MapPlotter are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-03-31

Initial public release.

### Added

- Interactive Leaflet map with zoom, pan, and full-screen fit-to-data
- **Point plotting** — coordinates (lat/lng) and address geocoding via Nominatim
- **Area plotting** — postcode/city boundaries via Nominatim and postcodes.io, custom polygon entry
- **Smart UK postcode handling** — full postcodes and outward codes resolve via postcodes.io with circular approximation, avoiding Nominatim bounding-box rectangles
- **Dataverse integration** — four data modes: coordinates, address geocoding, postcode points, and postcode area boundaries
- **Geocode write-back** — optionally persist resolved lat/lng coordinates back to a Dataverse table
- **Marker clustering** — overlapping points cluster into numbered circles with custom colour thresholds
- **Five basemaps** — Streets (OSM), Satellite (Esri World Imagery), Light (CartoDB Positron), Dark (CartoDB Dark Matter), Terrain (Stadia/Stamen)
- **Gazetteer search** — floating place-search box with fly-to navigation powered by Nominatim
- **Layer visibility** — per-item show/hide toggle in the sidebar items list
- **Dark / light theme** — follows OS preference, togglable in the UI
- **Built-in help dialog** — four-tab guide covering data types, Dataverse schemas, and tips
- Apache 2.0 open-source license
