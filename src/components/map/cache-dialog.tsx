import { useState, useCallback } from 'react';
import { Database, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  getCacheEntries,
  getCacheStats,
  deleteCacheEntry,
  clearCache,
  type CacheEntry,
} from '@/lib/api-cache';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAge(storedAt: number): string {
  const sec = Math.floor((Date.now() - storedAt) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatExpiry(entry: CacheEntry): string {
  const expiresAt = entry.storedAt + entry.ttlMs;
  const sec = Math.floor((expiresAt - Date.now()) / 1000);
  if (sec <= 0) return 'expired';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m left`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h left`;
  return `${Math.floor(hr / 24)}d left`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CacheDialog() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [stats, setStats] = useState({ entryCount: 0, sizeBytes: 0, sessionHits: 0 });

  const refresh = useCallback(() => {
    setEntries(getCacheEntries());
    setStats(getCacheStats());
  }, []);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) refresh();
  }

  function handleDelete(url: string) {
    deleteCacheEntry(url);
    refresh();
  }

  function handleClearAll() {
    clearCache();
    refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="shadow-md">
          <Database className="w-3.5 h-3.5 mr-1.5" />
          Cache
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            API Cache
          </DialogTitle>
        </DialogHeader>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-lg font-semibold">{stats.entryCount}</p>
            <p className="text-[11px] text-muted-foreground">Entries</p>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-lg font-semibold">{formatBytes(stats.sizeBytes)}</p>
            <p className="text-[11px] text-muted-foreground">Stored</p>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-lg font-semibold">{stats.sessionHits}</p>
            <p className="text-[11px] text-muted-foreground">Hits this session</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Responses from Nominatim (24 h) and postcodes.io (7 days) are cached in your
          browser's local storage. Cached responses are returned instantly without a network
          request, keeping API usage within rate limits.
        </p>

        <Separator />

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {entries.length === 0 ? 'No cached entries' : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" onClick={refresh}>
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
            {entries.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Entry list */}
        {entries.length > 0 ? (
          <div className="max-h-72 overflow-y-auto flex flex-col gap-0.5 pr-1">
            {entries.map((entry) => (
              <div
                key={entry.url}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 group text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{entry.label}</p>
                  <p className="text-[10px] text-muted-foreground flex gap-2">
                    <span>{formatAge(entry.storedAt)}</span>
                    <span>·</span>
                    <span>{formatExpiry(entry)}</span>
                    {entry.hits > 0 && (
                      <>
                        <span>·</span>
                        <span>{entry.hits} hit{entry.hits !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity focus:opacity-100 flex-shrink-0"
                  onClick={() => handleDelete(entry.url)}
                  aria-label={`Delete cache entry: ${entry.label}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            The cache is empty. Results will be stored here after the first geocoding request.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
