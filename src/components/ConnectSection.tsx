import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowLeftRight, Check, Sparkles, Lock, Repeat } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { squads } from "@/data/squads";
import { traders, type Trader } from "@/data/traders";
import { initials } from "@/data/players";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";

const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

// Hash estável do uid p/ gerar id numérico e dispersar levemente o pino no mapa.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const jitter = (h: number, k: number) => (((h * k) % 1000) / 1000 - 0.5) * 0.12;

export function ConnectSection() {
  const { user, hydrated, openAuth } = useAuth();

  const [query, setQuery] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [selected, setSelected] = useState<Trader | null>(traders[0]);
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [Map, setMap] = useState<any>(null);
  const [realTraders, setRealTraders] = useState<Trader[]>([]);

  // Figurinhas que FALTAM e as que tenho REPETIDAS (para troca), lidas do álbum.
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [myDupes, setMyDupes] = useState<Set<string>>(new Set());
  useEffect(() => {
    const miss = new Set<string>();
    const dupes = new Set<string>();
    for (const s of squads) {
      let owned = new Set<number>();
      let trade = new Set<number>();
      try {
        const o = localStorage.getItem(`album-owned-${s.code}`);
        if (o) owned = new Set(JSON.parse(o) as number[]);
        const t = localStorage.getItem(`album-trade-${s.code}`);
        if (t) trade = new Set(JSON.parse(t) as number[]);
      } catch {
        /* ignora */
      }
      for (const p of s.players) {
        if (!owned.has(p.id)) miss.add(norm(p.name));
        if (trade.has(p.id)) dupes.add(norm(p.name));
      }
    }
    setMissing(miss);
    setMyDupes(dupes);
  }, [user]);

  const iNeed = (player: string) => missing.has(norm(player));
  const iHaveForTrade = (player: string) => myDupes.has(norm(player));
  const matchCount = (t: Trader) => t.has.filter(iNeed).length;

  // Carrega o mapa (logado: mapa real; deslogado: prévia borrada como chamariz).
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

  // Busca colecionadores REAIS (Firestore) que têm figurinhas para troca e localização.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    getDocs(collection(db, "users"))
      .then((snap) => {
        if (!alive) return;
        const list: Trader[] = [];
        snap.forEach((docSnap) => {
          const u = docSnap.data() as any;
          const rawTrades: any[] = Array.isArray(u.trades) ? u.trades : [];
          const has = rawTrades.map((t) => (typeof t === "string" ? t : t?.name)).filter(Boolean) as string[];
          if (!has.length) return;
          if (typeof u.lat !== "number" || typeof u.lng !== "number") return;
          const h = hashStr(docSnap.id);
          list.push({
            id: 1_000_000 + (h % 1_000_000),
            name: u.name || "Colecionador",
            city: u.city ? String(u.city).split(" - ")[0] : "—",
            distance: "—",
            rating: 5,
            has,
            wants: [],
            lat: u.lat + jitter(h, 7),
            lng: u.lng + jitter(h, 13),
            avatar: initials(u.name || "?"),
            isMe: docSnap.id === user.uid,
          });
        });
        setRealTraders(list);
      })
      .catch(() => {
        /* sem Firestore / sem permissão — fica só com os fictícios */
      });
    return () => {
      alive = false;
    };
  }, [user, myDupes]);

  // Colecionadores reais primeiro, depois os de exemplo.
  const everyone = useMemo(() => [...realTraders, ...traders], [realTraders]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    let list = everyone;
    if (q) {
      list = list.filter(
        (t) => t.has.some((s) => norm(s).includes(q)) || t.wants.some((s) => norm(s).includes(q)) || norm(t.name).includes(q) || norm(t.city).includes(q),
      );
    }
    if (onlyMatches) list = list.filter((t) => matchCount(t) > 0);
    // mais compatíveis com o seu álbum primeiro
    return [...list].sort((a, b) => matchCount(b) - matchCount(a));
  }, [query, onlyMatches, missing, everyone]);

  const totalMatches = everyone.reduce((acc, t) => acc + matchCount(t), 0);

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

        {/* Antes de hidratar não sabemos se há sessão — placeholder neutro evita "piscar". */}
        {!hydrated ? (
          <div className="grid h-[420px] place-items-center rounded-3xl border border-border bg-card text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : !user ? (
          /* ---------- Prévia (chamariz): mapa borrado + chamada para cadastro ---------- */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative h-[480px] overflow-hidden rounded-3xl border-2 border-border bg-muted shadow-xl"
          >
            {/* Mapa em segundo plano, sem interação */}
            <div className="pointer-events-none absolute inset-0 scale-105 blur-[3px]" aria-hidden>
              {mounted && Map ? (
                <Map.MapContainer center={[-15.78, -47.92]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} zoomControl={false} dragging={false} attributionControl={false}>
                  <Map.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {traders.map((t) => (
                    <Map.Marker key={t.id} position={[t.lat, t.lng]} />
                  ))}
                </Map.MapContainer>
              ) : null}
            </div>

            {/* Camada escura + chamada */}
            <div className="absolute inset-0 grid place-items-center bg-[color:var(--fifa-night)]/70 px-6 text-center backdrop-blur-[1px]">
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--fifa-yellow)] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[color:var(--fifa-green-deep)]">
                  <MapPin className="h-3.5 w-3.5" /> {traders.length} colecionadores online
                </span>
                <h3 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
                  Sua próxima figurinha pode estar mais perto do que você imagina
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/80">
                  Crie sua conta para revelar o mapa e descobrir quem troca as figurinhas que faltam no seu álbum.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => openAuth("signup")}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-7 py-3 text-sm font-bold text-white transition-all hover:scale-[1.03] hover:bg-[color:var(--fifa-green-deep)]"
                  >
                    <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    Criar conta grátis
                  </button>
                  <button
                    onClick={() => openAuth("login")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
                  >
                    <Lock className="h-4 w-4" /> Já tenho conta
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ---------- Logado: mapa + colecionadores ---------- */
          <>
            {/* Resumo */}
            <div className="mx-auto mb-6 flex max-w-3xl flex-wrap justify-center gap-3">
              {[
                { l: "Colecionadores", v: everyone.length },
                { l: "Trocas compatíveis", v: totalMatches },
                { l: "Minhas repetidas", v: myDupes.size },
                { l: "Cidades", v: new Set(everyone.map((t) => t.city)).size },
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
                      <h3 className="flex items-center gap-2 font-display text-2xl">
                        {selected.name}
                        {selected.isMe && (
                          <span className="rounded-full bg-[color:var(--fifa-green)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Você</span>
                        )}
                      </h3>
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
                      {selected.wants.map((s) => {
                        const canGive = iHaveForTrade(s);
                        return (
                          <span
                            key={s}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              canGive ? "bg-[color:var(--fifa-blue)] text-white" : "bg-[color:var(--fifa-blue)]/10 text-[color:var(--fifa-blue)]"
                            }`}
                          >
                            {canGive && <Repeat className="h-3 w-3" />}
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {selected.isMe ? (
                    <div className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--fifa-green)]/40 bg-[color:var(--fifa-green)]/10 px-6 py-3 text-sm font-semibold text-[color:var(--fifa-green)]">
                      <MapPin className="h-4 w-4" /> Esta é a sua localização no mapa
                    </div>
                  ) : (
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
                  )}
                </motion.div>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Colecionadores de demonstração · marque suas repetidas em “Meu Álbum” para oferecer trocas.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
