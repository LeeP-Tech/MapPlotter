import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ─── Tiny layout helpers ─────────────────────────────────────────────────────

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold mt-4 mb-1.5">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground leading-relaxed mb-2">{children}</p>;
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">{children}</code>
  );
}

function TableSchema({
  rows,
}: {
  rows: Array<{ col: string; type: string; note?: string; optional?: boolean }>;
}) {
  return (
    <div className="rounded-md border overflow-hidden text-xs my-2">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/60 text-left">
            <th className="px-2.5 py-1.5 font-medium">Column (logical name)</th>
            <th className="px-2.5 py-1.5 font-medium">Type</th>
            <th className="px-2.5 py-1.5 font-medium text-muted-foreground">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.col} className="border-t">
              <td className="px-2.5 py-1.5 font-mono">{r.col}</td>
              <td className="px-2.5 py-1.5 text-muted-foreground">{r.type}</td>
              <td className="px-2.5 py-1.5 text-muted-foreground">
                {r.optional && (
                  <span className="text-amber-600 dark:text-amber-400 mr-1">optional</span>
                )}
                {r.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab contents ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div>
      <P>
        Map Plotter lets you visualise geographic data on an interactive, zoomable map. Data
        can come from <strong>manual entry</strong> (typed in the sidebar) or directly from a
        <strong> Dataverse table</strong>.
      </P>
      <H3>Two data types</H3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border p-2.5">
          <p className="font-medium mb-1">📍 Points</p>
          <p className="text-muted-foreground">
            Single locations — a dot on the map. Enter as coordinates, address,
            or postcode. Dense points auto-cluster into numbered circles.
          </p>
        </div>
        <div className="rounded-md border p-2.5">
          <p className="font-medium mb-1">🟦 Areas</p>
          <p className="text-muted-foreground">
            Boundary polygons — a filled region. Enter as a postcode / place
            name (fetched from OpenStreetMap) or paste custom coordinate pairs.
          </p>
        </div>
      </div>
      <H3>Two data sources</H3>
      <P>
        <strong>Manual tab</strong> — type or paste data directly into the sidebar form.
        Good for one-off exploration.
      </P>
      <P>
        <strong>Dataverse tab</strong> — connect to a table in your Power Platform environment.
        The maker adds the table in Power Apps Studio; the user configures which columns to use
        at runtime. Configuration is saved to browser storage.
      </P>
      <H3>Clustering</H3>
      <P>
        Use the <strong>Cluster</strong> toggle on the map toolbar to group nearby points into
        numbered circles. Zoom in to expand clusters. Useful when you have dozens or hundreds
        of overlapping markers.
      </P>
    </div>
  );
}

function DataTypesTab() {
  return (
    <div>
      <H3>Points — manual entry</H3>
      <div className="space-y-2 text-xs">
        <div className="rounded-md border p-2.5">
          <p className="font-medium">Coordinates</p>
          <p className="text-muted-foreground">
            Enter latitude and longitude directly. Fastest — no external API call.
          </p>
        </div>
        <div className="rounded-md border p-2.5">
          <p className="font-medium">Address geocoding</p>
          <p className="text-muted-foreground">
            Type any address (e.g. <Code>10 Downing Street, London</Code>). The app uses
            the OpenStreetMap Nominatim API — rate limited to 1 request/second.
          </p>
        </div>
        <div className="rounded-md border p-2.5">
          <p className="font-medium">Postcode (as point)</p>
          <p className="text-muted-foreground">
            UK postcodes (e.g. <Code>SW1A 1AA</Code>) use postcodes.io — fast, no rate
            limit. Other postcodes/ZIP codes use Nominatim.
          </p>
        </div>
      </div>

      <Separator className="my-3" />

      <H3>Areas — manual entry</H3>
      <div className="space-y-2 text-xs">
        <div className="rounded-md border p-2.5">
          <p className="font-medium">Postcode / place name boundary</p>
          <p className="text-muted-foreground">
            UK full postcodes (e.g. <Code>SW1A 1AA</Code>) → 100 m circle
            &nbsp;·&nbsp; UK outward codes (e.g. <Code>SW1A</Code>) → 1 km circle
            &nbsp;·&nbsp; Cities, regions, US ZIP codes → real OSM boundary polygon.
          </p>
        </div>
        <div className="rounded-md border p-2.5">
          <p className="font-medium">Custom polygon</p>
          <p className="text-muted-foreground">
            Paste coordinate pairs, one per line: <Code>51.5060, -0.1300</Code>.
            Minimum 3 points. The ring is auto-closed.
          </p>
        </div>
      </div>
    </div>
  );
}

function DataverseGuideTab() {
  return (
    <div>
      <P>
        The Dataverse tab supports four data modes. Choose the mode that matches your
        table structure. All configurations are saved in browser storage.
      </P>

      {/* ── Mode 1 ── */}
      <H3>Mode 1 · Direct Coordinates</H3>
      <P>
        Your table already stores latitude and longitude as decimal numbers.
        This is the fastest mode — no geocoding, no external API calls.
      </P>
      <TableSchema
        rows={[
          { col: 'cr123_name', type: 'Single line text', note: 'Map label' },
          { col: 'cr123_latitude', type: 'Decimal number', note: 'e.g. 51.5074' },
          { col: 'cr123_longitude', type: 'Decimal number', note: 'e.g. −0.1278' },
        ]}
      />
      <P>After loading, use "Fit to Data" to zoom to all plotted points.</P>

      {/* ── Mode 2 ── */}
      <Separator className="my-3" />
      <H3>Mode 2 · Geocode Addresses</H3>
      <P>
        Your table has free-text addresses. The app geocodes each one via OpenStreetMap
        Nominatim (~1 second per row). A progress bar shows estimated time remaining.
      </P>
      <TableSchema
        rows={[
          { col: 'cr123_name', type: 'Single line text', note: 'Map label' },
          { col: 'cr123_address', type: 'Single line text', note: 'Full address string' },
          {
            col: 'cr123_latitude',
            type: 'Decimal number',
            optional: true,
            note: 'Enable write-back to populate automatically',
          },
          {
            col: 'cr123_longitude',
            type: 'Decimal number',
            optional: true,
            note: 'Enable write-back to populate automatically',
          },
        ]}
      />
      <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 mt-1">
        <strong>Tip — Write-back:</strong> Enable "Write back coordinates" to save geocoded
        lat/lng into your table. Next session, switch to <em>Direct Coordinates</em> mode for
        instant loading — no re-geocoding.
      </div>

      {/* ── Mode 3 ── */}
      <Separator className="my-3" />
      <H3>Mode 3 · Postcodes as Points</H3>
      <P>
        Each row has a postcode. The app resolves it to a centroid point.
        UK full postcodes use postcodes.io (fast). Others use Nominatim (rate limited).
      </P>
      <TableSchema
        rows={[
          { col: 'cr123_name', type: 'Single line text', note: 'Map label' },
          { col: 'cr123_postcode', type: 'Single line text', note: 'e.g. SW1A 1AA or 10001' },
          {
            col: 'cr123_latitude',
            type: 'Decimal number',
            optional: true,
            note: 'For write-back',
          },
          {
            col: 'cr123_longitude',
            type: 'Decimal number',
            optional: true,
            note: 'For write-back',
          },
        ]}
      />

      {/* ── Mode 4 ── */}
      <Separator className="my-3" />
      <H3>Mode 4 · Postcodes as Areas</H3>
      <P>
        Each row has a postcode or place name. The app fetches a boundary polygon for
        each one (~1 second per row via Nominatim or postcodes.io).
      </P>
      <TableSchema
        rows={[
          { col: 'cr123_name', type: 'Single line text', note: 'Map label / tooltip' },
          { col: 'cr123_postcode', type: 'Single line text', note: 'Postcode, ZIP, or place name' },
        ]}
      />
      <P>
        Write-back is not available in this mode (polygon data is too large to store
        in a Dataverse column).
      </P>

      {/* ── Write-back ── */}
      <Separator className="my-3" />
      <H3>Write-back — primary key column</H3>
      <P>
        To write coordinates back to your table you must provide the{' '}
        <strong>primary key column name</strong>. For a custom table named{' '}
        <Code>cr123_locations</Code>, the primary key is typically{' '}
        <Code>cr123_locationsid</Code> (table name + <Code>id</Code>). Find the exact name
        in <em>Maker Portal → Tables → [your table] → Settings → Schema name</em>.
      </P>
    </div>
  );
}

function TipsTab() {
  return (
    <div>
      <H3>Rate limits</H3>
      <P>
        OpenStreetMap Nominatim (used for address geocoding, non-UK postcodes, and area
        boundaries) enforces a <strong>1 request/second</strong> policy. Exceeding this
        risks your IP being temporarily blocked.
      </P>
      <div className="rounded-md border text-xs overflow-hidden my-2">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-2.5 py-1.5 font-medium">Rows</th>
              <th className="px-2.5 py-1.5 font-medium">Nominatim</th>
              <th className="px-2.5 py-1.5 font-medium">UK Postcode (postcodes.io)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['10', '~11 sec', '~2 sec'],
              ['50', '~1 min', '~10 sec'],
              ['100', '~2 min', '~20 sec'],
              ['500', '~9 min', '~1.5 min'],
            ].map(([rows, nom, pc]) => (
              <tr key={rows} className="border-t">
                <td className="px-2.5 py-1.5">{rows}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground">{nom}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground">{pc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        <strong>Recommendation:</strong> Use Geocode / Postcode mode for initial setup with
        write-back enabled, then switch to Direct Coordinates for all future loads.
      </P>

      <Separator className="my-3" />
      <H3>Large datasets</H3>
      <P>
        Dataverse caps a single query page at 5,000 rows (Max rows setting).
        For larger datasets consider pre-filtering with an OData filter expression,
        e.g. <Code>statecode eq 0</Code> (active records only).
      </P>
      <P>
        Clustering is recommended when you have more than ~50 overlapping points — it keeps
        the map readable and improves performance.
      </P>

      <Separator className="my-3" />
      <H3>OData filter examples</H3>
      <div className="space-y-1 text-xs font-mono bg-muted/40 rounded-md p-2">
        <p>statecode eq 0</p>
        <p>cr123_country eq 'United Kingdom'</p>
        <p>createdon ge 2025-01-01T00:00:00Z</p>
        <p>cr123_latitude ne null</p>
      </div>

      <Separator className="my-3" />
      <H3>Do I need intermediate tables?</H3>
      <P>
        No — geocoding is always performed in-memory and the results are temporary (lost
        on refresh). To <em>persist</em> decoded coordinates, enable{' '}
        <strong>Write back coordinates</strong> in the Dataverse tab. This writes lat/lng
        into your existing table — no separate intermediate table is required.
      </P>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full flex-shrink-0" title="How to use">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-3 flex-shrink-0">
          <DialogTitle>How to use Map Plotter</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="overview" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="mx-6 mb-1 flex-shrink-0 grid grid-cols-4 h-8">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="datatypes" className="text-xs">Data types</TabsTrigger>
            <TabsTrigger value="dataverse" className="text-xs">Dataverse</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">Tips &amp; limits</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto px-6 py-3">
            <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
            <TabsContent value="datatypes" className="mt-0"><DataTypesTab /></TabsContent>
            <TabsContent value="dataverse" className="mt-0"><DataverseGuideTab /></TabsContent>
            <TabsContent value="tips" className="mt-0"><TipsTab /></TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
