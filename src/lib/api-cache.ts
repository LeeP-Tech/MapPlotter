const STORAGE_KEY = 'mapplotter_api_cache';

export const NOMINATIM_TTL_MS = 24 * 60 * 60 * 1000;      // 24 hours
export const POSTCODE_TTL_MS  = 7  * 24 * 60 * 60 * 1000; // 7 days

export type CacheEntry = {
  url: string;
  label: string;
  storedAt: number;
  ttlMs: number;
  /** Persisted hit count (across sessions). Incremented in-memory; saved on write ops. */
  hits: number;
  data: unknown;
};

// ─── In-memory store ─────────────────────────────────────────────────────────

const cache = new Map<string, CacheEntry>();

/** Session-only hit counter — resets on page reload. */
let sessionHits = 0;

// ─── Persistence ─────────────────────────────────────────────────────────────

function load(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries: CacheEntry[] = JSON.parse(raw);
    const now = Date.now();
    for (const entry of entries) {
      if (now - entry.storedAt < entry.ttlMs) {
        cache.set(entry.url, entry);
      }
    }
  } catch {
    // Corrupt storage — start fresh
  }
}

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cache.values()]));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

// Load on module init
load();

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns a cached value, or null if absent / expired. */
export function getCached<T>(url: string): T | null {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.storedAt >= entry.ttlMs) {
    cache.delete(url);
    save();
    return null;
  }
  entry.hits++;
  sessionHits++;
  return entry.data as T;
}

/** Stores a value in the cache. */
export function setCached(url: string, data: unknown, label: string, ttlMs: number): void {
  cache.set(url, { url, data, label, storedAt: Date.now(), ttlMs, hits: 0 });
  save();
}

/**
 * Fetch-with-cache helper.
 * Checks cache first; calls `fetchFn` (which handles any rate-limiting) only on a miss.
 */
export async function cachedJsonFetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  label: string,
  ttlMs: number = NOMINATIM_TTL_MS,
): Promise<T> {
  const cached = getCached<T>(url);
  if (cached !== null) return cached;

  const data = await fetchFn();
  setCached(url, data, label, ttlMs);
  return data;
}

/** Returns all non-expired entries, newest first. */
export function getCacheEntries(): CacheEntry[] {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.storedAt >= entry.ttlMs) cache.delete(key);
  }
  return [...cache.values()].sort((a, b) => b.storedAt - a.storedAt);
}

/** Removes a single entry. */
export function deleteCacheEntry(url: string): void {
  cache.delete(url);
  save();
}

/** Clears all entries. */
export function clearCache(): void {
  cache.clear();
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** Returns summary statistics. */
export function getCacheStats(): { entryCount: number; sizeBytes: number; sessionHits: number } {
  const entries = getCacheEntries();
  let sizeBytes = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    sizeBytes = raw ? new TextEncoder().encode(raw).length : 0;
  } catch { /* ignore */ }
  return { entryCount: entries.length, sizeBytes, sessionHits };
}
