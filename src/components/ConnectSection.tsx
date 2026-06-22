import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowLeftRight, Check, Sparkles, Lock, Repeat, Bell, Navigation, MessageCircle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { squads } from "@/data/squads";
import { type Trader } from "@/data/traders";
import { initials } from "@/data/players";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { haversineKm } from "@/lib/profile";
import { sendTradeRequest } from "@/lib/trades";
import { useTrades } from "@/lib/trades-context";
import { TradeRequestModal } from "@/components/TradeRequestModal";
import { Avatar } from "@/components/Avatar";

const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

// Hash estável do uid p/ gerar id numérico e dispersar levemente o pino no mapa.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const jitter = (h: number, k: number) => (((h * k) % 1000) / 1000 - 0.5) * 0.12;

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function ConnectSection() {
  const { user, hydrated, openAuth, openEdit } = useAuth();
  const { requests, incomingPending, openPanel, openChat } = useTrades();

  const [query, setQuery] = useState("");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [selected, setSelected] = useState<Trader | null>(null);
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [Map, setMap] = useState<any>(null);
  const [Lib, setLib] = useState<any>(null);
  const [realTraders, setRealTraders] = useState<Trader[]>([]);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<Trader | null>(null);

  // Índice por nome do jogador -> foto + código da figurinha (ex.: "BRA10").
  const playerIndex = useMemo(() => {
    const m: Record<string, { photo: string | null; cutout: boolean; code?: string }> = {};
    for (const s of squads) {
      const prefix = s.album?.prefix;
      for (const p of s.players) {
        const code = prefix && p.albumNo ? `${prefix}${p.albumNo}` : undefined;
        m[norm(p.name)] = { photo: (p as any).photo ?? null, cutout: !!(p as any).photoCutout, code };
      }
    }
    return m;
  }, []);

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
  const codesOf = (t: Trader) => t.has.map((n) => playerIndex[norm(n)]?.code).filter(Boolean) as string[];

  // Carrega o mapa (logado: real; deslogado: prévia borrada como chamariz).
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
      setLib(L);
    });
  }, []);

  // Pino = mini figurinha (foto) com cauda de pin e badge +N quando há mais de uma.
  const iconOf = (t: Trader) => {
    if (!Lib) return undefined;
    const info = playerIndex[norm(t.has[0] ?? "")];
    const photo = info?.photo ?? null;
    const count = t.has.length;
    const ring = t.isMe ? "#002776" : "#FFDF00";
    const inner = photo
      ? `<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:${info?.cutout ? "top" : "center"};" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:17px;color:#fff;">${t.avatar}</div>`;
    const badge =
      count > 1
        ? `<div style="position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 4px;border-radius:999px;background:#009739;color:#fff;border:2px solid #fff;font:700 11px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;">+${count - 1}</div>`
        : "";
    const html = `<div style="position:relative;width:44px;height:54px;filter:drop-shadow(0 4px 5px rgba(0,0,0,.45));"><div style="width:44px;height:54px;border-radius:10px;overflow:hidden;border:2px solid ${ring};background:linear-gradient(135deg,#FFDF00,#009739);">${inner}</div>${badge}<div style="position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${ring};"></div></div>`;
    return Lib.divIcon({ html, className: "", iconSize: [44, 61], iconAnchor: [22, 61], popupAnchor: [0, -58] });
  };

  // Colecionadores REAIS (Firestore) com figurinhas para troca e localização.
  // Carrega mesmo deslogado (leitura pública) para a prévia também mostrar gente real.
  useEffect(() => {
    let alive = true;
    getDocs(collection(db, "users"))
      .then((snap) => {
        if (!alive) return;
        const list: Trader[] = [];
        snap.forEach((docSnap) => {
          const u = docSnap.data() as any;
          const isMe = !!user && docSnap.id === user.uid;
          if (isMe && typeof u.lat === "number" && typeof u.lng === "number") setMyLoc({ lat: u.lat, lng: u.lng });
          const rawTrades: any[] = Array.isArray(u.trades) ? u.trades : [];
          const has = rawTrades.map((t) => (typeof t === "string" ? t : t?.name)).filter(Boolean) as string[];
          if (!has.length) return;
          if (typeof u.lat !== "number" || typeof u.lng !== "number") return;
          const h = hashStr(docSnap.id);
          list.push({
            id: 1_000_000 + (h % 1_000_000),
            uid: docSnap.id,
            name: u.name || "Colecionador",
            city: u.city ? String(u.city).split(" - ")[0] : "—",
            distance: "—",
            rating: 5,
            has,
            wants: Array.isArray(u.wants) ? (u.wants as string[]) : [],
            lat: u.lat + jitter(h, 7),
            lng: u.lng + jitter(h, 13),
            avatar: initials(u.name || "?"),
            isMe,
            photo: typeof u.photo === "string" ? u.photo : undefined,
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

  const pendingToUids = useMemo(
    () => new Set(requests.filter((r) => r.fromUid === user?.uid && r.status === "pending").map((r) => r.toUid)),
    [requests, user],
  );

  // Apenas colecionadores reais (sem demonstração).
  const everyone = realTraders;

  const distOf = (t: Trader) => (myLoc ? haversineKm(myLoc, { lat: t.lat, lng: t.lng }) : null);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    const qCode = q.replace(/\s+/g, "");
    let list = everyone;
    if (q) {
      // Busca por FIGURINHA que a pessoa TEM para trocar (nome ou código), ou por cidade.
      list = list.filter(
        (t) =>
          t.has.some((s) => norm(s).includes(q)) ||
          codesOf(t).some((code) => norm(code).includes(qCode)) ||
          norm(t.city).includes(q),
      );
    }
    if (onlyMatches) list = list.filter((t) => matchCount(t) > 0);
    return [...list].sort((a, b) => {
      const m = matchCount(b) - matchCount(a);
      if (m !== 0) return m;
      const da = distOf(a);
      const dbb = distOf(b);
      if (da != null && dbb != null) return da - dbb;
      return 0;
    });
  }, [query, onlyMatches, missing, everyone, myLoc]);

  const totalMatches = everyone.reduce((acc, t) => acc + matchCount(t), 0);

  async function sendTo(target: Trader, message: string) {
    if (!user || !target.uid) return;
    const wanted = target.has.filter(iNeed);
    const offered = target.wants.filter((w) => iHaveForTrade(w));
    await sendTradeRequest({
      fromUid: user.uid,
      fromName: user.name,
      fromCity: user.city,
      toUid: target.uid,
      toName: target.name,
      wanted,
      offered,
      message: message || undefined,
    });
  }

  // Ranking: quem tem mais figurinhas que faltam no seu álbum (melhores trocas).
  const topMatches = useMemo(() => filtered.filter((t) => !t.isMe && matchCount(t) > 0).slice(0, 12), [filtered, missing]);

  // Derivados do colecionador selecionado.
  const selMatched = selected ? selected.has.filter(iNeed) : [];
  const selHasShown = selected ? [...selected.has].sort((a, b) => Number(iNeed(b)) - Number(iNeed(a))).slice(0, 18) : [];
  const selWantsSorted = selected ? [...selected.wants].sort((a, b) => Number(iHaveForTrade(b)) - Number(iHaveForTrade(a))) : [];
  const selWantsShown = selWantsSorted.slice(0, 12);
  const selDist = selected ? distOf(selected) : null;

  return (
    <section id="conectar" className="relative bg-background py-14 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-6xl text-[color:var(--fifa-green)] sm:text-7xl">
            TROCAS
          </motion.h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">Encontre colecionadores e troque as figurinhas que faltam no seu álbum.</p>
        </div>

        {!hydrated ? (
          <div className="grid h-[420px] place-items-center rounded-3xl border border-border bg-card text-sm text-muted-foreground">Carregando…</div>
        ) : !user ? (
          /* ---------- Prévia (chamariz): mapa borrado + chamada para cadastro ---------- */
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative isolate z-0 h-[420px] overflow-hidden rounded-3xl border-2 border-border bg-muted shadow-xl sm:h-[480px]">
            <div className="pointer-events-none absolute inset-0 scale-105 blur-[3px]" aria-hidden>
              {mounted && Map ? (
                <Map.MapContainer center={[-15.78, -47.92]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} zoomControl={false} dragging={false} attributionControl={false}>
                  <Map.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {realTraders.map((t) => (
                    <Map.Marker key={t.id} position={[t.lat, t.lng]} icon={iconOf(t)} />
                  ))}
                </Map.MapContainer>
              ) : null}
            </div>
            <div className="absolute inset-0 grid place-items-center bg-[color:var(--fifa-night)]/70 px-6 text-center backdrop-blur-[1px]">
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--fifa-yellow)] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[color:var(--fifa-green-deep)]">
                  <MapPin className="h-3.5 w-3.5" /> {realTraders.length > 0 ? `${realTraders.length} colecionadores no mapa` : "Entre e apareça no mapa"}
                </span>
                <h3 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">Sua próxima figurinha pode estar mais perto do que você imagina</h3>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/80">Crie sua conta para revelar o mapa e descobrir quem troca as figurinhas que faltam no seu álbum.</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button onClick={() => openAuth("signup")} className="group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-7 py-3 text-sm font-bold text-white transition-all hover:scale-[1.03] hover:bg-[color:var(--fifa-green-deep)]">
                    <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:rotate-180" /> Criar conta grátis
                  </button>
                  <button onClick={() => openAuth("login")} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10">
                    <Lock className="h-4 w-4" /> Já tenho conta
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ---------- Logado ---------- */
          <>
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
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busque por figurinha, código (ex.: BRA10) ou cidade"
                  className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                />
              </div>
              <button
                onClick={() => setOnlyMatches((v) => !v)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${onlyMatches ? "border-[color:var(--fifa-green)] bg-[color:var(--fifa-green)] text-white" : "border-border bg-card hover:border-[color:var(--fifa-green)]"}`}
              >
                <Sparkles className="h-4 w-4" /> Só compatíveis
              </button>
              <button onClick={openPanel} className="relative flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-all hover:border-[color:var(--fifa-green)]">
                <Bell className="h-4 w-4" /> Meus pedidos
                {incomingPending > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--fifa-green)] px-1 text-[11px] font-bold text-white">{incomingPending}</span>
                )}
              </button>
            </div>

            {topMatches.length > 0 && (
              <div className="mb-6">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">
                  <Sparkles className="h-4 w-4" /> Quem tem mais figurinhas que faltam pra você
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {topMatches.map((t) => {
                    const d = distOf(t);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={`flex min-w-[250px] shrink-0 items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-all hover:border-[color:var(--fifa-green)] ${
                          selected?.id === t.id ? "border-[color:var(--fifa-green)] ring-2 ring-[color:var(--fifa-green)]/25" : "border-border"
                        }`}
                      >
                        <Avatar name={t.name} photo={t.photo} size={44} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{t.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {t.city}
                            {d != null ? ` · ${fmtDist(d)}` : ""}
                          </div>
                          <div className="mt-0.5 text-sm font-bold text-[color:var(--fifa-green)]">{matchCount(t)} que você precisa</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Mapa — acompanha a altura do card ao lado */}
              <div className="relative isolate z-0 h-full min-h-[360px] overflow-hidden rounded-3xl border-2 border-border bg-muted shadow-xl sm:min-h-[480px]">
                {mounted && Map ? (
                  <Map.MapContainer center={[-15.78, -47.92]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                    <Map.TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {filtered.map((t) => {
                      const d = distOf(t);
                      return (
                        <Map.Marker key={t.id} position={[t.lat, t.lng]} icon={iconOf(t)} eventHandlers={{ click: () => setSelected(t) }}>
                          <Map.Popup>
                            <div className="min-w-[180px]">
                              <div className="text-sm font-bold text-foreground">{t.isMe ? `${t.name} (você)` : t.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {t.city}
                                {d != null ? ` · ${fmtDist(d)}` : ""}
                              </div>
                              {matchCount(t) > 0 && (
                                <div className="mt-1 text-xs font-semibold text-[color:var(--fifa-green)]">{matchCount(t)} figurinha(s) que você precisa</div>
                              )}
                              {!t.isMe && t.uid && (
                                <div className="mt-2.5 flex gap-1.5">
                                  {pendingToUids.has(t.uid) ? (
                                    <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[color:var(--fifa-green-deep)] px-2.5 py-1.5 text-xs font-bold text-white">
                                      <Check className="h-3 w-3" /> Enviado
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setTradeTarget(t)}
                                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[color:var(--fifa-green)] px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[color:var(--fifa-green-deep)]"
                                    >
                                      <ArrowLeftRight className="h-3 w-3" /> Trocar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openChat({ uid: t.uid!, name: t.name, photo: t.photo })}
                                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[color:var(--fifa-green)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--fifa-green)] transition-colors hover:bg-[color:var(--fifa-green)]/10"
                                  >
                                    <MessageCircle className="h-3 w-3" /> Conversar
                                  </button>
                                </div>
                              )}
                              {!t.isMe && (
                                <button onClick={() => setSelected(t)} className="mt-2 block w-full text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                                  Ver detalhes →
                                </button>
                              )}
                            </div>
                          </Map.Popup>
                        </Map.Marker>
                      );
                    })}
                  </Map.MapContainer>
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">Carregando mapa...</div>
                )}
              </div>

              {/* Card do colecionador */}
              {selected && (
                <motion.div key={selected.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <Avatar name={selected.name} photo={selected.photo} size={64} />
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-2xl">
                        {selected.name}
                        {selected.isMe && <span className="rounded-full bg-[color:var(--fifa-green)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Você</span>}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {selected.city}
                        </span>
                        {selDist != null && (
                          <span className="inline-flex items-center gap-1 text-[color:var(--fifa-green)]">
                            <Navigation className="h-3 w-3" /> {fmtDist(selDist)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[color:var(--fifa-yellow)]">
                          <Star className="h-3 w-3 fill-current" /> {selected.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Destaque: o que ele tem para troca que VOCÊ precisa */}
                  {!selected.isMe && (
                    <div className="mt-5 rounded-2xl border border-[color:var(--fifa-green)]/30 bg-[color:var(--fifa-green)]/5 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">
                        <Sparkles className="h-4 w-4" /> Que você precisa ({selMatched.length})
                      </div>
                      {selMatched.length ? (
                        <div className="mt-3 flex flex-wrap gap-2.5">
                          {selMatched.map((name) => {
                            const info = playerIndex[norm(name)];
                            return (
                              <div key={name} className="w-14 text-center">
                                <div className="foil-sheen relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-[color:var(--fifa-yellow)] bg-fifa-gradient">
                                  {info?.photo ? (
                                    <img src={info.photo} alt={name} loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${info.cutout ? "object-top" : ""}`} />
                                  ) : (
                                    <div className="absolute inset-0 grid place-items-center font-display text-lg text-white">{initials(name)}</div>
                                  )}
                                  {info?.code && <span className="absolute bottom-0.5 left-0.5 rounded bg-black/55 px-1 text-[8px] font-bold text-[color:var(--fifa-yellow)]">{info.code}</span>}
                                </div>
                                <div className="mt-1 truncate text-[10px] text-muted-foreground">{name.split(" ")[0]}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Nada que falte no seu álbum por enquanto — mas pode ter repetidas que te interessam.</p>
                      )}
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">Tem para trocar</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selHasShown.map((s) => {
                        const need = iNeed(s);
                        return (
                          <span key={s} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${need ? "bg-[color:var(--fifa-green)] text-white" : "bg-[color:var(--fifa-green)]/10 text-[color:var(--fifa-green)]"}`}>
                            {need && <Check className="h-3 w-3" />}
                            {s}
                          </span>
                        );
                      })}
                      {selected.has.length > selHasShown.length && <span className="px-1 py-1 text-xs text-muted-foreground">+{selected.has.length - selHasShown.length}</span>}
                    </div>
                  </div>

                  {selWantsShown.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--fifa-blue)]">Está procurando</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selWantsShown.map((s) => {
                          const canGive = iHaveForTrade(s);
                          return (
                            <span key={s} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${canGive ? "bg-[color:var(--fifa-blue)] text-white" : "bg-[color:var(--fifa-blue)]/10 text-[color:var(--fifa-blue)]"}`}>
                              {canGive && <Repeat className="h-3 w-3" />}
                              {s}
                            </span>
                          );
                        })}
                        {selWantsSorted.length > selWantsShown.length && <span className="px-1 py-1 text-xs text-muted-foreground">+{selWantsSorted.length - selWantsShown.length}</span>}
                      </div>
                    </div>
                  )}

                  {/* Ação */}
                  {selected.isMe ? (
                    <div className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--fifa-green)]/40 bg-[color:var(--fifa-green)]/10 px-6 py-3 text-sm font-semibold text-[color:var(--fifa-green)]">
                      <MapPin className="h-4 w-4" /> Esta é a sua localização no mapa
                    </div>
                  ) : selected.uid ? (
                    <div className="mt-6 flex gap-2">
                      {pendingToUids.has(selected.uid) ? (
                        <div className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green-deep)] px-4 py-3 text-sm font-semibold text-white">
                          <Check className="h-4 w-4" /> Pedido enviado
                        </div>
                      ) : (
                        <button onClick={() => setTradeTarget(selected)} className="group flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[color:var(--fifa-green-deep)]">
                          <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:rotate-180" /> Solicitar troca
                        </button>
                      )}
                      <button
                        onClick={() => openChat({ uid: selected.uid!, name: selected.name, photo: selected.photo })}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--fifa-green)]/40 px-4 py-3 text-sm font-semibold text-[color:var(--fifa-green)] transition-all hover:bg-[color:var(--fifa-green)]/10"
                      >
                        <MessageCircle className="h-4 w-4" /> Conversar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRequested((prev) => new Set(prev).add(selected.id))}
                      disabled={requested.has(selected.id)}
                      className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-default disabled:bg-[color:var(--fifa-green-deep)] disabled:hover:scale-100"
                    >
                      {requested.has(selected.id) ? (
                        <>
                          <Check className="h-4 w-4" /> Troca solicitada! <span className="opacity-70">(exemplo)</span>
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

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <button onClick={openEdit} className="font-semibold text-[color:var(--fifa-green)] underline-offset-2 hover:underline">
                Editar meu perfil
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de envio de pedido */}
      <TradeRequestModal
        target={tradeTarget}
        wanted={tradeTarget ? tradeTarget.has.filter(iNeed) : []}
        offered={tradeTarget ? tradeTarget.wants.filter((w) => iHaveForTrade(w)) : []}
        onClose={() => setTradeTarget(null)}
        onSend={(message) => sendTo(tradeTarget!, message)}
      />
    </section>
  );
}
