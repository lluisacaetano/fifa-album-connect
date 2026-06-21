import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Globe } from "lucide-react";
import { squads, squadByCode } from "@/data/squads";
import { initials } from "@/data/players";

const storageKey = (code: string) => `album-owned-${code}`;
const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

// Cada figurinha exibida carrega o país a que pertence (necessário na visão "Todos").
type Card = { id: number; name: string; position: string; number?: string | null; photo: string | null; code: string; country: string };

const BRAZIL_COLORS: [string, string] = ["#009739", "#FFDF00"];

export function AlbumSection() {
  const [code, setCode] = useState("all");
  const [query, setQuery] = useState("");
  const [ownedMap, setOwnedMap] = useState<Record<string, Set<number>>>({});

  // Carrega do navegador o que já está marcado em TODAS as seleções (1x ao montar).
  useEffect(() => {
    const map: Record<string, Set<number>> = {};
    for (const s of squads) {
      try {
        const saved = localStorage.getItem(storageKey(s.code));
        map[s.code] = saved ? new Set(JSON.parse(saved) as number[]) : new Set();
      } catch {
        map[s.code] = new Set();
      }
    }
    setOwnedMap(map);
  }, []);

  const isAll = code === "all";
  const squad = isAll ? null : squadByCode(code) ?? squads[0];

  // Cor de fundo: do país selecionado, ou verde do Brasil no "Todos".
  const [c1] = isAll ? BRAZIL_COLORS : squad!.colors;
  const sectionBg = `linear-gradient(160deg, ${c1} 0%, color-mix(in srgb, ${c1} 42%, #04140b) 95%)`;

  function ownedHas(c: string, id: number) {
    return ownedMap[c]?.has(id) ?? false;
  }

  function toggle(c: string, id: number) {
    setOwnedMap((prev) => {
      const next = new Set(prev[c] ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey(c), JSON.stringify([...next]));
      } catch {
        /* ignora */
      }
      return { ...prev, [c]: next };
    });
  }

  const allCards: Card[] = useMemo(() => {
    const source = isAll ? squads : [squad!];
    return source.flatMap((s) => s.players.map((p) => ({ ...p, code: s.code, country: s.name })));
  }, [isAll, squad]);

  const ownedCount = allCards.filter((c) => ownedHas(c.code, c.id)).length;
  const progress = allCards.length ? Math.round((ownedCount / allCards.length) * 100) : 0;

  const visible = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return allCards;
    return allCards.filter((c) => norm(c.name).includes(q));
  }, [allCards, query]);

  const titleLabel = isAll ? "Todas as seleções" : squad!.name;

  return (
    <section id="album" className="relative overflow-hidden py-24 text-white">
      {/* Fundo que muda com a seleção (crossfade) */}
      <motion.div
        key={code}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 -z-10"
        style={{ background: sectionBg }}
      />

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
              Escolha uma seleção (ou <strong>Todos</strong>) e clique nas figurinhas para marcar quais você <strong>tem</strong>. Salvo por país.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { l: "Total", v: allCards.length },
              { l: "Tenho", v: ownedCount },
              { l: "Faltam", v: allCards.length - ownedCount },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
                <div className="font-display text-3xl text-[color:var(--fifa-yellow)]">{s.v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Seletor: Todos + seleções */}
        <div className="mb-6 flex gap-2.5 overflow-x-auto pb-4 [scrollbar-width:thin]">
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
          {squads.map((s) => {
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
              placeholder="Buscar jogador em todas as seleções..."
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
          <p className="py-12 text-center text-sm text-white/70">Nenhum jogador encontrado para “{query}”.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
            {visible.map((c, i) => {
              const has = ownedHas(c.code, c.id);
              return (
                <motion.button
                  key={`${c.code}-${c.id}`}
                  type="button"
                  onClick={() => toggle(c.code, c.id)}
                  aria-pressed={has}
                  title={has ? `Você tem ${c.name} (${c.country}) — clique para desmarcar` : `Falta ${c.name} (${c.country}) — clique se conseguiu`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.25 }}
                  whileHover={{ y: -6, rotate: has ? -2 : 0 }}
                  whileTap={{ scale: 0.92 }}
                  className={`group foil-sheen relative aspect-[3/4] cursor-pointer rounded-xl border-2 p-[3px] text-left transition-all ${
                    has ? "border-[color:var(--fifa-yellow)] bg-fifa-gradient text-white shadow-lg" : "border-white/30 bg-white/10 text-white/80 backdrop-blur-sm"
                  }`}
                >
                  {has && <span className="foil-sheen-layer rounded-xl" aria-hidden />}

                  <span
                    className={`absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold shadow ${
                      has ? "bg-white text-[color:var(--fifa-green)]" : "bg-white/80 text-[color:var(--fifa-green-deep)]"
                    }`}
                  >
                    {has ? "✓" : "+"}
                  </span>

                  {/* No modo "Todos" mostra a bandeira; senão, o número da camisa */}
                  {isAll ? (
                    <img
                      src={`https://flagcdn.com/w40/${c.code}.png`}
                      alt={c.country}
                      className="absolute left-1.5 top-1.5 z-10 h-3.5 w-5 rounded-[2px] object-cover shadow ring-1 ring-black/20"
                    />
                  ) : (
                    c.number && (
                      <span className={`absolute left-1.5 top-1 z-10 font-display text-lg leading-none ${has ? "text-white/90" : "text-white/70"}`}>{c.number}</span>
                    )
                  )}

                  <div className={`relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-lg ${has ? "" : "opacity-80 grayscale"}`}>
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.name}
                        loading="lazy"
                        className="absolute inset-x-0 bottom-0 mx-auto h-[88%] w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="font-display text-4xl opacity-80">{initials(c.name)}</span>
                      </div>
                    )}

                    <div className={`relative z-[1] w-full rounded-md px-1 py-1 text-center font-display text-[11px] leading-tight ${has ? "bg-black/35 text-white" : "bg-black/30 text-white"}`}>
                      {c.name}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
