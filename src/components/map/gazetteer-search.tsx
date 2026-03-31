import { useState, useRef, useCallback } from 'react';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchGazetteer, type GazetteerResult } from '@/lib/geocoding';
import type L from 'leaflet';

type Props = {
  map: L.Map | null;
};

export function GazetteerSearch({ map }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GazetteerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchGazetteer(trimmed);
      setResults(data);
      setOpen(true);
      if (data.length === 0) setError('No places found.');
    } catch {
      setError('Search error — please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function flyTo(result: GazetteerResult) {
    if (!map) return;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.flyTo([lat, lng], 13, { duration: 1.2 });
    setOpen(false);
    setQuery(result.display_name.split(',')[0]);
    setResults([]);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setError(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter') {
      search(query);
    }
  }

  return (
    <div className="relative w-64">
      {/* Input row */}
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-2 h-9">
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />
        ) : (
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search places…"
          className="border-0 shadow-none p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-5 h-5 flex-shrink-0"
            onClick={clear}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs flex-shrink-0"
          disabled={!query.trim() || loading}
          onClick={() => search(query)}
        >
          Go
        </Button>
      </div>

      {/* Results dropdown */}
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl z-[1000] overflow-hidden">
          {error ? (
            <p className="text-xs text-muted-foreground px-3 py-2.5">{error}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    className="w-full text-left flex items-start gap-2 px-3 py-2 hover:bg-muted/60 transition-colors"
                    onClick={() => flyTo(r)}
                  >
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span className="text-xs leading-snug line-clamp-2">{r.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
