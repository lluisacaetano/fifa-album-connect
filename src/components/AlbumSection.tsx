import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Minus, Plus, Repeat } from "lucide-react";
import { squads, squadByCode } from "@/data/squads";
import { initials } from "@/data/players";

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

  // Clique cicla: falta (0) → tenho (1) → troca (2) → falta (0).
  const cycle = (c: string, id: number) => {
    const n = getCount(c, id);
    setCount(c, id, n >= 2 ? 0 : n + 1);
  };
  const inc = (c: string, id: number) => setCount(c, id, getCount(c, id) + 1);
  const dec = (c: string, id: number) => setCount(c, id, Math.max(1, getCount(c, id) - 1)); // mín. 1: para zerar, clique na figurinha

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
    <section id="album" className="relative overflow-hidden py-24 text-white" style={{ background: sectionBg }}>
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
              1 clique = você <strong>tem</strong>. Clique <strong>de novo</strong> e ela vira <strong>troca</strong> (repetida). Use o + para contar mais de uma.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { l: "Total", v: allCards.length },
              { l: "Tenho", v: ownedCount },
              { l: "Faltam", v: allCards.length - ownedCount },
              { l: "Troco", v: tradeCount },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
                <div className="font-display text-3xl text-[color:var(--fifa-yellow)]">{s.v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

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
                      forTrade
                        ? `${c.name} (${c.country}) está para troca — clique para limpar`
                        : has
                          ? `Você tem ${c.name} (${c.country}) — clique de novo para marcar como troca`
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
                        disabled={count <= 1}
                        aria-label="Tirar uma repetida"
                        className="grid h-5 w-5 place-items-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-30"
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
      </div>
    </section>
  );
}
