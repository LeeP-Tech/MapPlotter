# Contributing to MapPlotter

Thank you for your interest in contributing. This document covers everything you need to get started.

---

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

---

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Set up locally

```bash
git clone https://github.com/leepasifull/mapplotter.git
cd mapplotter
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## How to contribute

### Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml). Include steps to reproduce, expected vs actual behaviour, and your browser/environment.

### Suggesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml). Explain the use case clearly — the problem you're solving matters more than the specific solution.

### Submitting a pull request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/describe-your-change
   ```
   Branch naming conventions:
   - `fix/` — bug fixes
   - `feat/` — new features
   - `docs/` — documentation only
   - `chore/` — dependency updates, tooling

2. **Make your changes.** Keep commits focused and atomic.

3. **Verify locally:**
   ```bash
   npm run build   # must pass with no errors
   npm run lint    # must pass with no errors
   ```

4. **Open a PR** against `main`. Fill in the pull request template. Link any related issues with `Closes #<issue>`.

---

## Project structure

```
src/
  components/map/      # Map UI components (leaflet-map, data-panel, gazetteer, etc.)
  lib/                 # Pure logic (geocoding, basemaps, dataverse integration)
  stores/              # Zustand state stores
  types/               # Shared TypeScript types
  pages/               # Page-level components (home, layout, not-found)
```

---

## Code style

- **TypeScript** — all new code must be typed; avoid `any` where possible
- **Formatting** — the project uses `.editorconfig` for consistent whitespace; prefer your editor's format-on-save
- **Components** — function components only; no class components
- **State** — Zustand stores for shared state; local `useState` for UI-only state
- **No test framework is currently set up** — if you add tests, open a discussion first about the approach

---

## Nominatim rate limiting

Changes that call Nominatim must respect the 1 req/sec rate limit enforced in `nominatimFetch()`. Do not remove or bypass this delay.

---

## Questions?

Open a [GitHub Discussion](../../discussions) or file an issue with the `question` label.
