# Patching & Dependency Maintenance

This document describes how to keep MapPlotter's dependencies current and free of known security vulnerabilities.

---

## 1. Check for vulnerabilities

Run the npm security audit to identify packages with known CVEs:

```bash
npm audit
```

To attempt automatic remediation of fixable issues:

```bash
npm audit fix
```

If `npm audit fix` cannot resolve everything automatically (e.g. a major-version bump is required), review the output and apply the required upgrade manually — see Section 3.

---

## 2. Check for outdated packages

```bash
npm outdated
```

This lists every installed package alongside its current, wanted (latest semver-compatible), and latest (absolute latest) versions. The output uses the following convention:

| Column | Meaning |
|---|---|
| Current | Version installed in `node_modules` |
| Wanted | Highest version allowed by the `package.json` semver range |
| Latest | Absolute latest published version |

---

## 3. Apply updates

### Patch and minor updates (low risk)

```bash
npm update
```

This installs all packages up to the version allowed by their semver range in `package.json`. It will not cross major-version boundaries.

### Major-version updates (review required)

Major version bumps can contain breaking API changes. Upgrade them individually and verify the app still builds and runs:

```bash
npm install <package>@latest
npm run build
npm run lint
```

Key packages to watch for major version releases:

| Package | Notes |
|---|---|
| `react` / `react-dom` | Check React release notes for deprecated APIs |
| `react-leaflet` | Tracks Leaflet major versions; check migration guide |
| `leaflet` | rare breaking changes; check changelog |
| `@tanstack/react-query` | Major versions have migration guides at tanstack.com |
| `react-router-dom` | Significant API changes between major versions |
| `zustand` | Generally stable; check migration notes |
| `tailwindcss` | Config format and utility names can change across majors |

### Upgrading all packages to their absolute latest (advanced)

Use [npm-check-updates](https://github.com/raineorshine/npm-check-updates) to rewrite `package.json` to the latest versions, then reinstall:

```bash
npx npm-check-updates -u
npm install
npm run build
```

Review and test carefully after using this approach.

---

## 4. Automate with GitHub Dependabot

Add a `.github/dependabot.yml` file to enable automated pull requests for dependency updates:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
```

Dependabot will open PRs weekly for outdated packages, each with a changelog summary. Merge after reviewing the build passes.

---

## 5. External API / tile provider changes

The following runtime dependencies are not npm packages and cannot be updated via `npm`. Monitor them separately.

| Service | What to monitor |
|---|---|
| **Nominatim** (OpenStreetMap) | [API changelog](https://nominatim.org/release-dates/); breaking changes to the `/search` endpoint response shape |
| **postcodes.io** | [GitHub releases](https://github.com/ideal-postcodes/postcodes.io/releases); field name changes in the `/postcodes` and `/outcodes` responses |
| **Esri World Imagery tiles** | URL format is stable; monitor [Esri status](https://status.arcgis.com/) |
| **CartoDB basemap tiles** | URL format stable; monitor [CARTO status](https://status.carto.com/) |
| **Stadia Maps (Stamen Terrain)** | [Stadia changelog](https://stadiamaps.com/news/); tile URL format may change |
| **Power Apps host bridge** | `window.__powerAppsBridge` injection is an internal SDK contract — test after Power Apps environment upgrades |

---

## 6. Recommended patching cadence

| Frequency | Action |
|---|---|
| Weekly (automated) | Dependabot PRs for patch/minor updates |
| Monthly | Run `npm audit` manually; review any unresolved advisories |
| Each major release | Upgrade major-version dependencies individually with testing |
| After Power Apps updates | Smoke-test the Dataverse tab inside a live Power Apps environment |
