import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { squads, squadByCode } from "@/data/squads";

export function PlayersCarousel() {
  const [code, setCode] = useState("br");
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0]);

  const squad = squadByCode(code) ?? squads[0];
  const p = squad.players[Math.min(index, squad.players.length - 1)];

  // Fundo muda com a seleção (cor do país misturada com verde-noite para leitura).
  const [c1] = squad.colors;
  const sectionBg = `linear-gradient(160deg, ${c1} 0%, color-mix(in srgb, ${c1} 42%, #04140b) 95%)`;

  const paginate = (delta: number) => {
    setIndex(([i]) => {
      const next = (i + delta + squad.players.length) % squad.players.length;
      return [next, delta];
    });
  };

  const selectCountry = (newCode: string) => {
    setCode(newCode);
    setIndex([0, 0]);
  };

  const bio =
    p.desc ??
    `${p.position} da seleção ${squad.name}${p.number ? ` · camisa ${p.number}` : ""}. Uma das figurinhas para colecionar nesta Copa.`;

  const hasStats = p.goals != null || p.assists != null || p.apps != null;

  return (
    <section id="jogadores" className="relative overflow-hidden py-20 text-white" style={{ background: sectionBg }}>
      {/* Decoração: estrela grande translúcida no canto */}
      <div aria-hidden className="pointer-events-none absolute -left-10 top-4 select-none font-display text-[16rem] leading-none text-white/10">
        ★
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col items-center text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl sm:text-6xl"
          >
            JOGADORES
          </motion.h2>
          <p className="mt-2 text-sm text-white/70">Escolha uma seleção e conheça os craques, um a um.</p>
        </div>

        {/* Seletor de seleção */}
        <div className="mx-auto mb-10 flex max-w-4xl flex-wrap justify-center gap-2.5 pb-1">
          {squads.map((s) => {
            const active = s.code === code;
            return (
              <button
                key={s.code}
                type="button"
                onClick={() => selectCountry(s.code)}
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

        <div className="relative grid min-h-[520px] items-center gap-6 lg:grid-cols-2">
          {/* Texto */}
          <div className="relative order-2 lg:order-1">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={`${code}-${p.id}-text`}
                custom={dir}
                initial={{ opacity: 0, x: dir * -80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * 80 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h3 className="font-display text-6xl text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)] sm:text-7xl">{p.name}</h3>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                  <span className="rounded-full bg-[color:var(--fifa-green)] px-3 py-1 text-white">{p.position}</span>
                  {p.number && <span className="rounded-full bg-[color:var(--fifa-blue)] px-3 py-1 text-white">#{p.number}</span>}
                  {p.club && <span className="rounded-full bg-white px-3 py-1 text-[color:var(--fifa-green-deep)]">{p.club}</span>}
                  {p.age != null && <span className="rounded-full bg-white/15 px-3 py-1 text-white ring-1 ring-white/25">{p.age} anos</span>}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[color:var(--fifa-green-deep)]">
                    <img src={`https://flagcdn.com/w40/${squad.code}.png`} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                    {squad.name}
                  </span>
                </div>

                <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">{bio}</p>

                {hasStats && (
                  <div className="mt-6 flex max-w-md gap-3">
                    {[
                      { label: "Gols", value: p.goals },
                      { label: "Assist.", value: p.assists },
                      { label: "Jogos", value: p.apps },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/20">
                        <div className="font-display text-3xl text-white">{s.value ?? 0}</div>
                        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Foto */}
          <div className="relative order-1 h-[380px] sm:h-[500px] lg:order-2">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.img
                key={`${code}-${p.id}-img`}
                src={p.photo ?? ""}
                alt={p.name}
                custom={dir}
                initial={{ opacity: 0, x: dir * 120, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: dir * -120, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.4)]"
                loading="lazy"
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Controles */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={() => paginate(-1)}
            aria-label="Anterior"
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-[color:var(--fifa-green-deep)] shadow-lg transition-all hover:scale-110 hover:bg-[color:var(--fifa-yellow)]"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="min-w-[5rem] rounded-full bg-white/15 px-4 py-2 text-center font-display text-lg tracking-wider text-white ring-1 ring-white/25">
            {index + 1} / {squad.players.length}
          </div>

          <button
            onClick={() => paginate(1)}
            aria-label="Próximo"
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-[color:var(--fifa-green-deep)] shadow-lg transition-all hover:scale-110 hover:bg-[color:var(--fifa-yellow)]"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
