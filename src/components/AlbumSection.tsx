import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Minus, Plus, Repeat, Lock } from "lucide-react";
import { squads, squadByCode } from "@/data/squads";
import { initials } from "@/data/players";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { saveUserAlbum, type TradeSticker } from "@/lib/profile";
import { useTrades } from "@/lib/trades-context";
import { markTradeApplied } from "@/lib/trades";

const countKey = (code: string) => `album-count-${code}`;
const ownedKey = (code: string) => `album-owned-${code}`;
const tradeKey = (code: string) => `album-trade-${code}`;
const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

// Cada figurinha exibida carrega o país a que pertence (necessário na visão "Todos").
// kind: jogador, ou as figurinhas especiais da seleção (escudo / foto oficial).
type Card = {
  id: number;
  name: string;
  kind: "player" | "crest" | "photo";
  sticker?: string; // código no álbum, ex.: "BRA1"
  no?: number; // posição da figurinha
  position?: string;
  number?: string | null;
  photo?: string | null;
  photoCutout?: boolean;
  photoScale?: number;
  code: string;
  country: string;
};

type Counts = Record<number, number>;

// Monta as 20 figurinhas oficiais de uma seleção (escudo + 18 jogadores + foto),
// na ordem certa. Se ainda não migrada ao álbum, mostra o elenco bruto (sem especiais).
function albumCards(s: (typeof squads)[number]): Card[] {
  const base = { code: s.code, country: s.name };
  const players = s.players.filter((p) => p.inAlbum);
  if (players.length === 0 || !s.album) {
    return s.players.map((p) => ({ ...p, kind: "player" as const, ...base }));
  }
  const { crestNo, photoNo, prefix, crest, photo } = s.album;
  const cards: Card[] = [
    { id: -1, no: crestNo, kind: "crest", name: `Escudo · ${s.name}`, photo: crest, ...base },
    { id: -2, no: photoNo, kind: "photo", name: `Seleção ${s.name}`, photo, ...base },
    ...players.map((p) => ({ ...p, no: p.albumNo ?? 0, kind: "player" as const, ...base })),
  ];
  return cards
    .sort((a, b) => (a.no ?? 0) - (b.no ?? 0))
    .map((c) => ({ ...c, sticker: `${prefix}${c.no}` }));
}

const BRAZIL_COLORS: [string, string] = ["#009739", "#FFDF00"];

export function AlbumSection() {
  const [code, setCode] = useState("br");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "trade">("all"); // "trade" = só as repetidas
  // Quantidade de cada figurinha. 0 = falta, 1 = tenho, 2+ = repetida (para troca).
  const [countMap, setCountMap] = useState<Record<string, Counts>>({});
  const [synced, setSynced] = useState(false); // já carregou o álbum do Firestore?
  const { user, hydrated, openAuth } = useAuth();
  const { requests } = useTrades();
  const applyingRef = useRef<Set<string>>(new Set());

  // Índice por nome do jogador -> { code, id } (para dar baixa nas trocas concluídas).
  const nameToCard = useMemo(() => {
    const idx: Record<string, { code: string; id: number }> = {};
    for (const s of squads) {
      for (const p of s.players) {
        const key = norm(p.name);
        if (!(key in idx)) idx[key] = { code: s.code, id: p.id };
      }
    }
    return idx;
  }, []);

  // Índice reverso: número da figurinha ("BRA1") -> { code, id } local.
  const stickerIndex = useMemo(() => {
    const idx: Record<string, { code: string; id: number }> = {};
    for (const s of squads) {
      for (const card of albumCards(s)) {
        idx[card.sticker ?? `${card.code}#${card.id}`] = { code: card.code, id: card.id };
      }
    }
    return idx;
  }, []);

  // Carrega do navegador o que já está marcado em TODAS as seleções (1x ao montar).
  // Migra do formato antigo (só "tenho/não tenho") para quantidades, se preciso.
  useEffect(() => {
    const map: Record<string, Counts> = {};
    for (const s of squads) {
      const counts: Counts = {};
      try {
        const saved = localStorage.getItem(countKey(s.code));
        if (saved) {
          Object.assign(counts, JSON.parse(saved) as Counts);
        } else {
          const owned = localStorage.getItem(ownedKey(s.code));
          if (owned) for (const id of JSON.parse(owned) as number[]) counts[id] = 1;
        }
      } catch {
        /* ignora */
      }
      map[s.code] = counts;
    }
    setCountMap(map);
  }, []);

  // Ao logar, carrega o álbum do Firestore (sincroniza entre dispositivos).
  // O banco prevalece quando tem dados; senão mantém o que já estava no aparelho.
  useEffect(() => {
    if (!user) {
      setSynced(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const album = snap.exists() ? (snap.data() as { album?: Record<string, number> }).album : null;
        if (alive && album && Object.keys(album).length) {
          const next: Record<string, Counts> = {};
          for (const [key, n] of Object.entries(album)) {
            const ref = stickerIndex[key];
            const count = Number(n);
            if (!ref || !count) continue;
            (next[ref.code] ??= {})[ref.id] = count;
          }
          setCountMap(next);
          for (const code of Object.keys(next)) persist(code, next[code]);
        }
      } catch {
        /* sem Firestore / sem permissão — segue com o que está no aparelho */
      } finally {
        if (alive) setSynced(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, stickerIndex]);

  const isAll = code === "all";
  const squad = isAll ? null : squadByCode(code) ?? squads[0];

  // Cor de fundo: do país selecionado, ou verde do Brasil no "Todos".
  const [c1] = isAll ? BRAZIL_COLORS : squad!.colors;
  const sectionBg = `linear-gradient(160deg, ${c1} 0%, color-mix(in srgb, ${c1} 42%, #04140b) 95%)`;

  const getCount = (c: string, id: number) => countMap[c]?.[id] ?? 0;

  // Salva quantidade + os derivados que a seção de Trocas lê (tenho / repetidas).
  function persist(c: string, counts: Counts) {
    const owned: number[] = [];
    const trade: number[] = [];
    for (const [id, n] of Object.entries(counts)) {
      const idNum = Number(id);
      if (n >= 1) owned.push(idNum);
      if (n >= 2) trade.push(idNum);
    }
    try {
      localStorage.setItem(countKey(c), JSON.stringify(counts));
      localStorage.setItem(ownedKey(c), JSON.stringify(owned));
      localStorage.setItem(tradeKey(c), JSON.stringify(trade));
    } catch {
      /* ignora */
    }
  }

  function setCount(c: string, id: number, n: number) {
    setCountMap((prev) => {
      const counts: Counts = { ...(prev[c] ?? {}) };
      if (n <= 0) delete counts[id];
      else counts[id] = n;
      persist(c, counts);
      return { ...prev, [c]: counts };
    });
  }

  // Clique soma sempre: falta (0) → tenho (1) → repetida (2) → ×3 → ×4 ...
  const cycle = (c: string, id: number) => setCount(c, id, getCount(c, id) + 1);
  const inc = (c: string, id: number) => setCount(c, id, getCount(c, id) + 1);
  const dec = (c: string, id: number) => setCount(c, id, getCount(c, id) - 1); // pode chegar a 0 (remove)

  // Monta o álbum por NÚMERO ("BRA1") + figurinhas para troca (2+) + as que faltam (wants).
  const syncPayload = useMemo(() => {
    const album: Record<string, number> = {};
    const trades: TradeSticker[] = [];
    const wants: string[] = [];
    for (const s of squads) {
      const counts = countMap[s.code] ?? {};
      for (const card of albumCards(s)) {
        const n = counts[card.id] ?? 0;
        if (n >= 1) {
          const key = card.sticker ?? `${card.code}#${card.id}`;
          album[key] = n;
          if (n >= 2 && card.kind === "player") trades.push({ code: key, name: card.name });
        } else if (card.kind === "player") {
          wants.push(card.name);
        }
      }
    }
    return { album, trades, wants };
  }, [countMap]);

  // Salva no Firestore (com debounce) quando logado — só após carregar o álbum do banco.
  useEffect(() => {
    if (!user || !synced) return;
    const t = setTimeout(() => saveUserAlbum(user.uid, syncPayload.album, syncPayload.trades, syncPayload.wants), 700);
    return () => clearTimeout(t);
  }, [syncPayload, user, synced]);

  // Aplica em lote variações de quantidade (uma única atualização de estado).
  function applyDeltas(deltas: { code: string; id: number; delta: number }[]) {
    if (!deltas.length) return;
    setCountMap((prev) => {
      const next = { ...prev };
      const touched = new Set<string>();
      for (const { code, id, delta } of deltas) {
        const counts: Counts = { ...(next[code] ?? {}) };
        const v = (counts[id] ?? 0) + delta;
        if (v <= 0) delete counts[id];
        else counts[id] = v;
        next[code] = counts;
        touched.add(code);
      }
      for (const code of touched) persist(code, next[code]);
      return next;
    });
  }

  // Troca CONCLUÍDA (os dois confirmaram): dá baixa só nas figurinhas que EU entreguei.
  // As que recebi, marco manualmente quando chegarem. Idempotente via appliedBy (Firestore).
  useEffect(() => {
    if (!user || !synced) return;
    const pending = requests.filter(
      (r) => r.status === "accepted" && r.participants.includes(user.uid) && !(r.appliedBy ?? []).includes(user.uid) && !applyingRef.current.has(r.id),
    );
    if (!pending.length) return;
    const deltas: { code: string; id: number; delta: number }[] = [];
    for (const r of pending) {
      applyingRef.current.add(r.id);
      const iGave = r.fromUid === user.uid ? r.offered : r.wanted;
      for (const name of iGave) {
        const ref = nameToCard[norm(name)];
        if (ref) deltas.push({ code: ref.code, id: ref.id, delta: -1 });
      }
    }
    applyDeltas(deltas);
    pending.forEach((r) =>
      markTradeApplied(r.id, user.uid).catch(() => {
        applyingRef.current.delete(r.id);
      }),
    );
  }, [requests, user, synced, nameToCard]);

  const allCards: Card[] = useMemo(() => {
    const source = isAll ? squads : [squad!];
    return source.flatMap((s) => albumCards(s));
  }, [isAll, squad]);

  const ownedCount = allCards.filter((c) => getCount(c.code, c.id) >= 1).length;
  const tradeCount = allCards.filter((c) => getCount(c.code, c.id) >= 2).length;
  const progress = allCards.length ? Math.round((ownedCount / allCards.length) * 100) : 0;

  // Progresso GERAL do álbum (todas as seleções somadas).
  const totalAll = useMemo(() => squads.reduce((n, s) => n + s.players.length, 0), []);
  const ownedAll = squads.reduce((n, s) => n + s.players.filter((p) => getCount(s.code, p.id) >= 1).length, 0);
  const progressAll = totalAll ? Math.round((ownedAll / totalAll) * 100) : 0;

  const searched = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return allCards;
    // busca por nome OU pelo número da figurinha (ex.: "BRA1", "bra 1", "1")
    const qNum = q.replace(/\s+/g, "");
    return allCards.filter((c) => norm(c.name).includes(q) || (c.sticker && norm(c.sticker).includes(qNum)));
  }, [allCards, query]);

  // Na visão "Para troca", mostra só as figurinhas com 2+ (repetidas).
  const visible = view === "trade" ? searched.filter((c) => getCount(c.code, c.id) >= 2) : searched;

  const titleLabel = isAll ? "Todas as seleções" : squad!.name;

  return (
    <section id="album" className="relative overflow-hidden py-14 text-white sm:py-24" style={{ background: sectionBg }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-5xl sm:text-6xl"
            >
              MEU ÁLBUM
            </motion.h2>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              Cada clique conta <strong>+1</strong> (você tem mais uma). A partir de <strong>2</strong>, a figurinha vira <strong>troca</strong> (repetida). Use o <strong>−</strong> para tirar.
            </p>
          </div>

          {user && (
            <div className="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto sm:gap-3">
              {[
                { l: "Total", v: allCards.length },
                { l: "Tenho", v: ownedCount },
                { l: "Faltam", v: allCards.length - ownedCount },
                { l: "Troco", v: tradeCount },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/15 bg-white/10 px-2 py-3 text-center backdrop-blur-sm sm:px-5">
                  <div className="font-display text-2xl text-[color:var(--fifa-yellow)] sm:text-3xl">{s.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!hydrated ? (
          <div className="grid h-[280px] place-items-center text-sm text-white/70">Carregando…</div>
        ) : !user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border-2 border-dashed border-white/30 bg-white/10 px-6 py-16 text-center backdrop-blur-sm"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h3 className="mt-5 font-display text-3xl">Entre para montar seu álbum</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
              Faça login para marcar suas figurinhas, contar repetidas e salvar tudo no seu perfil — sincronizado entre dispositivos.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => openAuth("signup")} className="rounded-full bg-white px-7 py-3 text-sm font-bold text-[color:var(--fifa-green-deep)] shadow-md transition-all hover:scale-[1.03]">
                Criar conta grátis
              </button>
              <button onClick={() => openAuth("login")} className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10">
                Já tenho conta
              </button>
            </div>
          </motion.div>
        ) : (
          <>

        {/* Seletor: Todos + seleções */}
        <div className="mb-6 flex gap-2.5 overflow-x-auto pb-3 [scrollbar-color:rgba(255,255,255,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:hover:bg-white/60 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
          <button
            type="button"
            onClick={() => setCode("all")}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
              isAll ? "border-white bg-white text-[color:var(--fifa-green-deep)] shadow-md" : "border-white/25 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Globe className="h-4 w-4" />
            Todos
          </button>
          {[...squads].sort((a, b) => a.name.localeCompare(b.name, "pt")).map((s) => {
            const active = s.code === code;
            return (
              <button
                key={s.code}
                type="button"
                onClick={() => setCode(s.code)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
                  active ? "border-white bg-white text-[color:var(--fifa-green-deep)] shadow-md" : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <img src={`https://flagcdn.com/w40/${s.code}.png`} alt="" className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Alternar entre o álbum inteiro e só as figurinhas para troca */}
        <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
          {[
            { key: "all" as const, label: "Álbum" },
            { key: "trade" as const, label: `Para troca${tradeCount ? ` · ${tradeCount}` : ""}` },
          ].map((opt) => {
            const active = view === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setView(opt.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  active ? "bg-white text-[color:var(--fifa-green-deep)] shadow" : "text-white/80 hover:text-white"
                }`}
              >
                {opt.key === "trade" && <Repeat className="h-3.5 w-3.5" />}
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Busca (ao digitar, pula para "Todos") + progresso */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--fifa-green-deep)]/60" />
            <input
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (v.trim() && !isAll) setCode("all"); // digitou: busca em todas
              }}
              placeholder="Buscar por jogador ou nº da figurinha (ex.: BRA1)..."
              className="w-full rounded-full border border-white/20 bg-white py-2.5 pl-9 pr-4 text-sm text-[color:var(--fifa-green-deep)] outline-none placeholder:text-[color:var(--fifa-green-deep)]/50"
            />
          </div>
          <div className="flex-1">
            <div className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-widest text-white/70">
              <span>{titleLabel}</span>
              <span>{progress}% completo</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <motion.div
                key={code}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-[color:var(--fifa-yellow)]"
              />
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          view === "trade" ? (
            <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 py-12 text-center">
              <Repeat className="mx-auto h-7 w-7 text-[color:var(--fifa-yellow)]" />
              <p className="mt-3 text-sm font-semibold text-white/85">
                {query ? `Nenhuma repetida encontrada para “${query}”.` : "Você ainda não tem figurinhas para troca."}
              </p>
              {!query && (
                <p className="mx-auto mt-1 max-w-sm text-xs text-white/65">
                  Marque uma figurinha que você tem e toque no <strong>+</strong> para contar as repetidas. A partir de 2, ela aparece aqui.
                </p>
              )}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-white/70">Nenhum jogador encontrado para “{query}”.</p>
          )
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
            {visible.map((c, i) => {
              const count = getCount(c.code, c.id);
              const has = count >= 1;
              const forTrade = count >= 2;
              return (
                <motion.div
                  key={`${c.code}-${c.id}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.25 }}
                  whileHover={{ y: -6, rotate: has ? -2 : 0 }}
                  className={`group foil-sheen relative aspect-[3/4] rounded-xl border-2 p-[3px] text-left transition-all ${
                    forTrade
                      ? "border-[color:var(--fifa-yellow)] bg-fifa-gradient text-white shadow-[0_0_0_2px_rgba(255,223,0,0.35),0_8px_20px_-6px_rgba(0,0,0,0.5)]"
                      : has
                        ? "border-[color:var(--fifa-yellow)] bg-fifa-gradient text-white shadow-lg"
                        : "border-white/30 bg-white/10 text-white/80 backdrop-blur-sm"
                  }`}
                >
                  {has && <span className="foil-sheen-layer rounded-xl" aria-hidden />}

                  {/* Clique principal: marca / desmarca que você TEM a figurinha. */}
                  <button
                    type="button"
                    onClick={() => cycle(c.code, c.id)}
                    aria-pressed={has}
                    title={
                      has
                        ? `Você tem ${count} de ${c.name} (${c.country}) — clique para somar mais uma`
                        : `Falta ${c.name} (${c.country}) — clique se conseguiu`
                    }
                    className="absolute inset-0 z-[1] rounded-xl outline-none ring-[color:var(--fifa-yellow)] focus-visible:ring-2"
                  />

                  {/* Badge canto: + (falta), ✓ (tenho), ou ×N (repetidas) */}
                  <span
                    className={`pointer-events-none absolute right-1 top-1 z-10 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold shadow ${
                      forTrade
                        ? "bg-[color:var(--fifa-yellow)] text-[color:var(--fifa-green-deep)]"
                        : has
                          ? "bg-white text-[color:var(--fifa-green)]"
                          : "bg-white/80 text-[color:var(--fifa-green-deep)]"
                    }`}
                  >
                    {forTrade ? `×${count}` : has ? "✓" : "+"}
                  </span>

                  {/* Etiqueta TROCA quando há repetidas */}
                  {forTrade && (
                    <span className="pointer-events-none absolute left-1 top-1 z-10 inline-flex items-center gap-0.5 rounded-md bg-[color:var(--fifa-blue)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow">
                      <Repeat className="h-2.5 w-2.5" /> Troca
                    </span>
                  )}

                  {/* No modo "Todos" a bandeira; o número da figurinha (BRA2) sempre que houver */}
                  {isAll && !forTrade && (
                    <img
                      src={`https://flagcdn.com/w40/${c.code}.png`}
                      alt={c.country}
                      className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-3.5 w-5 rounded-[2px] object-cover shadow ring-1 ring-black/20"
                    />
                  )}
                  {c.sticker && (
                    <span className={`pointer-events-none absolute bottom-9 left-1.5 z-10 rounded-md bg-black/45 px-1 text-[9px] font-bold tracking-wide ${has ? "text-[color:var(--fifa-yellow)]" : "text-white/85"}`}>
                      {c.sticker}
                    </span>
                  )}

                  <div className={`pointer-events-none relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-lg ${has ? "" : "opacity-80 grayscale"}`}>
                    {c.kind === "crest" ? (
                      <div className="absolute inset-0 grid place-items-center bg-white/10 p-3">
                        <img src={`${c.photo}?v=2`} alt={c.name} loading="lazy" className="max-h-full max-w-full object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]" />
                      </div>
                    ) : c.kind === "photo" ? (
                      <img src={`${c.photo}?v=2`} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : c.photo && c.photoCutout ? (
                      <img
                        src={c.photo}
                        alt={c.name}
                        loading="lazy"
                        style={c.photoScale ? { transform: `scale(${c.photoScale})`, transformOrigin: "top center" } : undefined}
                        className="absolute inset-0 h-full w-full object-cover object-top drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 grid place-items-center"
                        style={{ background: `radial-gradient(circle at 50% 35%, ${squadByCode(c.code)?.colors[0] ?? "#0b6b3a"}, transparent 70%)` }}
                      >
                        <span className="font-display text-4xl opacity-90">{initials(c.name)}</span>
                      </div>
                    )}

                    <div className={`relative z-[1] w-full rounded-md px-1 pb-6 pt-1 text-center font-display text-[11px] leading-tight ${has ? "bg-black/35 text-white" : "bg-black/30 text-white"}`}>
                      {c.name}
                    </div>
                  </div>

                  {/* Contador de repetidas — aparece quando você já tem a figurinha. */}
                  {has && (
                    <div className="absolute inset-x-1.5 bottom-1.5 z-20 flex items-center justify-between rounded-full bg-black/55 px-1 py-0.5 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => dec(c.code, c.id)}
                        aria-label={count <= 1 ? "Remover (não tenho)" : "Tirar uma"}
                        className="grid h-5 w-5 place-items-center rounded-full text-white transition-colors hover:bg-white/20"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-1 text-[11px] font-bold text-white">{count}</span>
                      <button
                        type="button"
                        onClick={() => inc(c.code, c.id)}
                        aria-label="Tenho mais uma (para trocar)"
                        className="grid h-5 w-5 place-items-center rounded-full text-white transition-colors hover:bg-[color:var(--fifa-yellow)] hover:text-[color:var(--fifa-green-deep)]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Progresso GERAL do álbum (todas as 48 seleções somadas) */}
        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold uppercase tracking-widest">
            <span className="text-white/85">Álbum completo · {ownedAll}/{totalAll} figurinhas</span>
            <span className="text-[color:var(--fifa-yellow)]">{progressAll}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white/15">
            <motion.div
              animate={{ width: `${progressAll}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-[color:var(--fifa-yellow)]"
            />
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  );
}
