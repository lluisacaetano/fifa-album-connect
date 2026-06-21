import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { squads, squadByCode } from "@/data/squads";
import { initials } from "@/data/players";

const storageKey = (code: string) => `album-owned-${code}`;
const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

export function AlbumSection() {
  const [code, setCode] = useState("br");
  const [query, setQuery] = useState("");
  const [ownedMap, setOwnedMap] = useState<Record<string, Set<number>>>({});

  const squad = squadByCode(code) ?? squads[0];

  // Carrega do navegador o que já está marcado para o país selecionado.
  useEffect(() => {
    setOwnedMap((prev) => {
      if (prev[code]) return prev;
      let set = new Set<number>();
      try {
        const saved = localStorage.getItem(storageKey(code));
        if (saved) set = new Set(JSON.parse(saved) as number[]);
      } catch {
        /* ignora */
      }
      return { ...prev, [code]: set };
    });
  }, [code]);

  const owned = ownedMap[code] ?? new Set<number>();

  function toggle(id: number) {
    setOwnedMap((prev) => {
      const next = new Set(prev[code] ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey(code), JSON.stringify([...next]));
      } catch {
        /* ignora */
      }
      return { ...prev, [code]: next };
    });
  }

  const ownedCount = squad.players.filter((p) => owned.has(p.id)).length;
  const progress = Math.round((ownedCount / squad.players.length) * 100);

  const visible = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return squad.players;
    return squad.players.filter((p) => norm(p.name).includes(q));
  }, [squad, query]);

  return (
    <section id="album" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-5xl text-foreground sm:text-6xl"
            >
              MEU ÁLBUM
            </motion.h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Escolha uma seleção e clique nas figurinhas para marcar quais você <strong>tem</strong>. Seu progresso fica salvo por país.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { l: "Total", v: squad.players.length },
              { l: "Tenho", v: ownedCount },
              { l: "Faltam", v: squad.players.length - ownedCount },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-card px-5 py-3 text-center">
                <div className="font-display text-3xl text-[color:var(--fifa-green)]">{s.v}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Seletor de seleção (chips com bandeira) */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {squads.map((s) => {
            const active = s.code === code;
            return (
              <button
                key={s.code}
                type="button"
                onClick={() => setCode(s.code)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
                  active
                    ? "border-[color:var(--fifa-green)] bg-[color:var(--fifa-green)] text-white shadow-md"
                    : "border-border bg-card text-foreground/80 hover:border-[color:var(--fifa-green)]/40"
                }`}
              >
                <img src={`https://flagcdn.com/w40/${s.code}.png`} alt="" className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Busca + progresso */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar jogador da ${squad.name}...`}
              className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[color:var(--fifa-green)]"
            />
          </div>
          <div className="flex-1">
            <div className="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>{squad.name}</span>
              <span>{progress}% completo</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <motion.div
                key={code}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-fifa-gradient"
              />
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum jogador encontrado para “{query}”.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
            {visible.map((p, i) => {
              const has = owned.has(p.id);
              return (
                <motion.button
                  key={`${code}-${p.id}`}
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={has}
                  title={has ? `Você tem ${p.name} — clique para desmarcar` : `Falta ${p.name} — clique se conseguiu`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.25 }}
                  whileHover={{ y: -6, rotate: has ? -2 : 0 }}
                  whileTap={{ scale: 0.92 }}
                  className={`group foil-sheen relative aspect-[3/4] cursor-pointer rounded-xl border-2 p-[3px] text-left transition-all ${
                    has
                      ? "border-[color:var(--fifa-yellow)] bg-fifa-gradient text-white shadow-lg"
                      : "border-dashed border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {has && <span className="foil-sheen-layer rounded-xl" aria-hidden />}

                  <span
                    className={`absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold shadow ${
                      has ? "bg-white text-[color:var(--fifa-green)]" : "bg-card text-muted-foreground"
                    }`}
                  >
                    {has ? "✓" : "+"}
                  </span>

                  {p.number && (
                    <span className={`absolute left-1.5 top-1 z-10 font-display text-lg leading-none ${has ? "text-white/90" : "text-muted-foreground/60"}`}>
                      {p.number}
                    </span>
                  )}

                  <div className={`relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-lg ${has ? "" : "opacity-60 grayscale"}`}>
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-x-0 bottom-0 mx-auto h-[88%] w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="font-display text-4xl opacity-80">{initials(p.name)}</span>
                      </div>
                    )}

                    <div className={`relative z-[1] w-full rounded-md px-1 py-1 text-center font-display text-[11px] leading-tight ${has ? "bg-black/35 text-white" : "bg-foreground/5"}`}>
                      {p.name}
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
