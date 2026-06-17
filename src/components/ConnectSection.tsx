import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowLeftRight } from "lucide-react";

type Trader = {
  id: number;
  name: string;
  city: string;
  distance: string;
  rating: number;
  has: string[];
  wants: string[];
  lat: number;
  lng: number;
  avatar: string;
};

const traders: Trader[] = [
  { id: 1, name: "Lucas Almeida", city: "Belo Horizonte", distance: "1.2 km", rating: 4.9, has: ["Neymar", "Mbappé", "Messi"], wants: ["Vini Jr", "Rodrygo"], lat: -19.917, lng: -43.934, avatar: "LA" },
  { id: 2, name: "Marina Costa", city: "Belo Horizonte", distance: "2.4 km", rating: 4.7, has: ["Bellingham", "Vini Jr", "Endrick"], wants: ["Neymar", "Alisson"], lat: -19.92, lng: -43.94, avatar: "MC" },
  { id: 3, name: "Rafael Souza", city: "Belo Horizonte", distance: "3.8 km", rating: 5.0, has: ["Mbappé", "Rodrygo", "Alisson"], wants: ["Messi", "Endrick"], lat: -19.905, lng: -43.925, avatar: "RS" },
  { id: 4, name: "Camila Lima", city: "Contagem", distance: "8.1 km", rating: 4.6, has: ["Messi", "Neymar"], wants: ["Bellingham", "Vini Jr"], lat: -19.93, lng: -44.05, avatar: "CL" },
];

export function ConnectSection() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Trader | null>(traders[0]);
  const [mounted, setMounted] = useState(false);
  const [Map, setMap] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      // fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMap(rl);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return traders;
    return traders.filter((t) =>
      t.has.some((s) => s.toLowerCase().includes(q)) ||
      t.wants.some((s) => s.toLowerCase().includes(q)) ||
      t.name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section id="conectar" className="relative bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-6xl text-[color:var(--fifa-green)] sm:text-7xl"
          >
            CONECTAR
          </motion.h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Encontre colecionadores perto de você e troque figurinhas em tempo real.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qual figurinha você procura? (ex: Neymar)"
              className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
            />
          </div>
          {["Cidade", "Seleção", "Posição"].map((f) => (
            <button key={f} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold transition-all hover:border-[color:var(--fifa-green)] hover:text-[color:var(--fifa-green)]">
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Map */}
          <div className="relative h-[480px] overflow-hidden rounded-3xl border-2 border-border bg-muted shadow-xl">
            {mounted && Map ? (
              <Map.MapContainer center={[-19.917, -43.934]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <Map.TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filtered.map((t) => (
                  <Map.Marker
                    key={t.id}
                    position={[t.lat, t.lng]}
                    eventHandlers={{ click: () => setSelected(t) }}
                  >
                    <Map.Popup>
                      <strong>{t.name}</strong>
                      <br />
                      {t.city} · {t.distance}
                    </Map.Popup>
                  </Map.Marker>
                ))}
              </Map.MapContainer>
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                Carregando mapa...
              </div>
            )}
          </div>

          {/* Trader card */}
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-fifa-gradient font-display text-2xl text-white">
                  {selected.avatar}
                </div>
                <div>
                  <h3 className="font-display text-2xl">{selected.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {selected.city} · {selected.distance}</span>
                    <span className="inline-flex items-center gap-1 text-[color:var(--fifa-yellow)]"><Star className="h-3 w-3 fill-current" /> {selected.rating}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">Possui</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.has.map((s) => (
                    <span key={s} className="rounded-full bg-[color:var(--fifa-green)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--fifa-green)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-blue)]">Procura</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.wants.map((s) => (
                    <span key={s} className="rounded-full bg-[color:var(--fifa-blue)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--fifa-blue)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)]">
                <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:rotate-180" />
                Solicitar Troca
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
