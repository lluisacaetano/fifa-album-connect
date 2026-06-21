import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowLeftRight, Check, Sparkles } from "lucide-react";
import { squads } from "@/data/squads";

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

// Colecionadores de exemplo espalhados pelo Brasil (dados simulados).
const traders: Trader[] = [
  { id: 1, name: "Lucas Almeida", city: "Belo Horizonte", distance: "1.2 km", rating: 4.9, has: ["Vinícius Júnior", "Rodrygo", "Endrick"], wants: ["Alisson", "Raphinha"], lat: -19.917, lng: -43.934, avatar: "LA" },
  { id: 2, name: "Marina Costa", city: "São Paulo", distance: "—", rating: 4.7, has: ["Raphinha", "Bruno Guimarães", "Savinho"], wants: ["Endrick", "Vinícius Júnior"], lat: -23.55, lng: -46.63, avatar: "MC" },
  { id: 3, name: "Rafael Souza", city: "Rio de Janeiro", distance: "—", rating: 5.0, has: ["Alisson", "Marquinhos", "Gerson"], wants: ["Rodrygo", "Estêvão"], lat: -22.9, lng: -43.2, avatar: "RS" },
  { id: 4, name: "Camila Lima", city: "Curitiba", distance: "—", rating: 4.6, has: ["Estêvão", "Igor Jesus", "Danilo"], wants: ["Bruno Guimarães", "Vinícius Júnior"], lat: -25.43, lng: -49.27, avatar: "CL" },
  { id: 5, name: "Pedro Henrique", city: "Salvador", distance: "—", rating: 4.8, has: ["Lucas Paquetá", "Gabriel Magalhães", "Bento"], wants: ["Endrick", "Savinho"], lat: -12.97, lng: -38.5, avatar: "PH" },
  { id: 6, name: "Júlia Fernandes", city: "Porto Alegre", distance: "—", rating: 4.5, has: ["Éder Militão", "Guilherme Arana", "André"], wants: ["Marquinhos", "Alisson"], lat: -30.03, lng: -51.23, avatar: "JF" },
  { id: 7, name: "Bruno Carvalho", city: "Recife", distance: "—", rating: 4.9, has: ["Endrick", "Vinícius Júnior", "Raphinha"], wants: ["Gerson", "Igor Jesus"], lat: -8.05, lng: -34.88, avatar: "BC" },
  { id: 8, name: "Aline Rocha", city: "Brasília", distance: "—", rating: 4.7, has: ["Rodrygo", "Savinho", "Alisson"], wants: ["Lucas Paquetá", "Estêvão"], lat: -15.79, lng: -47.88, avatar: "AR" },
];

const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

export function ConnectSection() {
  const [query, setQuery] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [selected, setSelected] = useState<Trader | null>(traders[0]);
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [Map, setMap] = useState<any>(null);

  // Figurinhas que faltam no SEU álbum (lidas do localStorage, por nome).
  const [missing, setMissing] = useState<Set<string>>(new Set());
  useEffect(() => {
    const miss = new Set<string>();
    for (const s of squads) {
      let owned = new Set<number>();
      try {
        const saved = localStorage.getItem(`album-owned-${s.code}`);
        if (saved) owned = new Set(JSON.parse(saved) as number[]);
      } catch {
        /* ignora */
      }
      for (const p of s.players) if (!owned.has(p.id)) miss.add(norm(p.name));
    }
    setMissing(miss);
  }, []);

  const iNeed = (player: string) => missing.has(norm(player));
  const matchCount = (t: Trader) => t.has.filter(iNeed).length;

  useEffect(() => {
    setMounted(true);
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
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
    const q = norm(query.trim());
    let list = traders;
    if (q) {
      list = list.filter(
        (t) => t.has.some((s) => norm(s).includes(q)) || t.wants.some((s) => norm(s).includes(q)) || norm(t.name).includes(q) || norm(t.city).includes(q),
      );
    }
    if (onlyMatches) list = list.filter((t) => matchCount(t) > 0);
    // mais compatíveis com o seu álbum primeiro
    return [...list].sort((a, b) => matchCount(b) - matchCount(a));
  }, [query, onlyMatches, missing]);

  const totalMatches = traders.reduce((acc, t) => acc + matchCount(t), 0);

  return (
    <section id="conectar" className="relative bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-6xl text-[color:var(--fifa-green)] sm:text-7xl"
          >
            TROCAS
          </motion.h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">Encontre colecionadores e troque as figurinhas que faltam no seu álbum.</p>
        </div>

        {/* Resumo */}
        <div className="mx-auto mb-6 flex max-w-2xl flex-wrap justify-center gap-3">
          {[
            { l: "Colecionadores", v: traders.length },
            { l: "Trocas compatíveis", v: totalMatches },
            { l: "Cidades", v: new Set(traders.map((t) => t.city)).size },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card px-5 py-3 text-center">
              <div className="font-display text-3xl text-[color:var(--fifa-green)]">{s.v}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qual figurinha você procura? (ex: Endrick)"
              className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
            />
          </div>
          <button
            onClick={() => setOnlyMatches((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
              onlyMatches ? "border-[color:var(--fifa-green)] bg-[color:var(--fifa-green)] text-white" : "border-border bg-card hover:border-[color:var(--fifa-green)]"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Só compatíveis com meu álbum
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Mapa */}
          <div className="relative h-[480px] overflow-hidden rounded-3xl border-2 border-border bg-muted shadow-xl">
            {mounted && Map ? (
              <Map.MapContainer center={[-15.78, -47.92]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <Map.TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filtered.map((t) => (
                  <Map.Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => setSelected(t) }}>
                    <Map.Popup>
                      <strong>{t.name}</strong>
                      <br />
                      {t.city}
                      {matchCount(t) > 0 && (
                        <>
                          <br />
                          <span style={{ color: "#009739" }}>{matchCount(t)} figurinha(s) que você precisa</span>
                        </>
                      )}
                    </Map.Popup>
                  </Map.Marker>
                ))}
              </Map.MapContainer>
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">Carregando mapa...</div>
            )}
          </div>

          {/* Card do colecionador */}
          {selected && (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-fifa-gradient font-display text-2xl text-white">{selected.avatar}</div>
                <div>
                  <h3 className="font-display text-2xl">{selected.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {selected.city}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[color:var(--fifa-yellow)]">
                      <Star className="h-3 w-3 fill-current" /> {selected.rating}
                    </span>
                  </div>
                </div>
              </div>

              {matchCount(selected) > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[color:var(--fifa-green)]/10 px-3 py-2 text-xs font-semibold text-[color:var(--fifa-green)]">
                  <Sparkles className="h-4 w-4" /> Tem {matchCount(selected)} figurinha(s) que falta(m) no seu álbum!
                </div>
              )}

              <div className="mt-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">Tem para trocar</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.has.map((s) => {
                    const need = iNeed(s);
                    return (
                      <span
                        key={s}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          need ? "bg-[color:var(--fifa-green)] text-white" : "bg-[color:var(--fifa-green)]/10 text-[color:var(--fifa-green)]"
                        }`}
                      >
                        {need && <Check className="h-3 w-3" />}
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-blue)]">Está procurando</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.wants.map((s) => (
                    <span key={s} className="rounded-full bg-[color:var(--fifa-blue)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--fifa-blue)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setRequested((prev) => new Set(prev).add(selected.id))}
                disabled={requested.has(selected.id)}
                className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-default disabled:bg-[color:var(--fifa-green-deep)] disabled:hover:scale-100"
              >
                {requested.has(selected.id) ? (
                  <>
                    <Check className="h-4 w-4" /> Troca solicitada!
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:rotate-180" /> Solicitar troca
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Colecionadores de demonstração · marque suas figurinhas em “Meu Álbum” para achar trocas compatíveis.</p>
      </div>
    </section>
  );
}
