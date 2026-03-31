# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 1.x (latest) | ✅ |

Older versions do not receive security fixes. Please update to the latest release.

---

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability privately, use one of the following options:

- **GitHub private advisory** — open a [Security Advisory](../../security/advisories/new) on this repository (recommended)
- **Email** — contact Lee Pasifull directly. If you cannot find contact details, use the GitHub advisory route above.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept (if safe to share)
- Any suggested mitigations you have identified

You can expect an acknowledgement within **5 business days** and a full response within **14 days**.

---

## Scope

### In scope

- Vulnerabilities in this project's own TypeScript/React source code
- Dependency vulnerabilities with a realistic exploit path in this application's context
- Sensitive data exposure (e.g. API keys, credentials inadvertently committed)

### Out of scope

- Vulnerabilities in third-party services (Nominatim, postcodes.io, tile providers) — report those to the respective projects
- Rate-limiting or abuse of external APIs — these are upstream concerns
- Theoretical vulnerabilities with no practical impact in this app's threat model

---

## Dependency vulnerabilities

Run `npm audit` to check for known CVEs in installed packages. See [PATCHING.md](PATCHING.md) for the full patching process.
