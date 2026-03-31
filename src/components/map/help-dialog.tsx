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

// ─── Tab contents ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div>
      <P>
        Map Plotter lets you visualise geographic data on an interactive, zoomable map.
        Add points and areas via manual entry in the sidebar.
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

      <P>
        Clustering is recommended when you have more than ~50 overlapping points — it keeps
        the map readable and improves performance.
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
          <TabsList className="mx-6 mb-1 flex-shrink-0 grid grid-cols-3 h-8">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="datatypes" className="text-xs">Data types</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">Tips &amp; limits</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto px-6 py-3">
            <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
            <TabsContent value="datatypes" className="mt-0"><DataTypesTab /></TabsContent>
            <TabsContent value="tips" className="mt-0"><TipsTab /></TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
