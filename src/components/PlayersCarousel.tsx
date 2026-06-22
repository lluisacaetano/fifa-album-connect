import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { squads, squadByCode, squadRoster } from "@/data/squads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PlayersCarousel() {
  const [code, setCode] = useState("br");
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0]);

  const squad = squadByCode(code) ?? squads[0];
  const players = squadRoster(squad); // só o elenco oficial (26) quando migrada
  const p = players[Math.min(index, players.length - 1)];

  // Fundo muda com a seleção (cor do país misturada com verde-noite para leitura).
  const [c1] = squad.colors;
  const sectionBg = `linear-gradient(160deg, ${c1} 0%, color-mix(in srgb, ${c1} 42%, #04140b) 95%)`;

  const paginate = (delta: number) => {
    setIndex(([i]) => {
      const next = (i + delta + players.length) % players.length;
      return [next, delta];
    });
  };

  const selectCountry = (newCode: string) => {
    setCode(newCode);
    setIndex([0, 0]);
  };

  // Descrição: usa a bio real quando houver; senão monta uma frase informativa
  // a partir dos dados do jogador (padrão consistente até preencher todas).
  const bio =
    p.desc ??
    (() => {
      let s = p.position;
      if (p.age != null) s += ` de ${p.age} anos`;
      if (p.club) s += `, atua pelo ${p.club}`;
      s += ".";
      const camisa = p.number ? `, com a camisa ${p.number}` : "";
      return `${s} Convocado pela seleção ${squad.name} para a Copa do Mundo de 2026${camisa}.`;
    })();

  // Só usa a foto quando é um cutout hi-res; senão mostra um card com a inicial
  // (evita as fotos pequenas/borradas da API-Football).
  const goodPhoto = p.photo && p.photoCutout;
  const initial = p.name.replace(/^\p{Lu}\.\s*/u, "").trim().charAt(0).toUpperCase() || p.name.charAt(0).toUpperCase();

  return (
    <section id="jogadores" className="relative overflow-hidden py-14 text-white sm:py-20" style={{ background: sectionBg }}>
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

        {/* Seletor de seleção (dropdown compacto) */}
        <div className="mx-auto mb-10 flex max-w-xs justify-center">
          <Select value={code} onValueChange={selectCountry}>
            <SelectTrigger className="h-12 rounded-full border-white/25 bg-white/10 px-5 text-base font-semibold text-white backdrop-blur hover:bg-white/20 focus:ring-white/40 [&>span]:flex [&>span]:items-center [&>span]:gap-2">
              <SelectValue>
                <img src={`https://flagcdn.com/w40/${squad.code}.png`} alt="" className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
                {squad.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {[...squads].sort((a, b) => a.name.localeCompare(b.name, "pt")).map((s) => (
                <SelectItem key={s.code} value={s.code} className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <img src={`https://flagcdn.com/w40/${s.code}.png`} alt="" className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <h3 className="font-display text-[2.75rem] leading-[0.95] text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)] sm:text-7xl">{p.name}</h3>

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

                {/* Cards SEMPRE visíveis (0 quando não há dado) — tela padronizada p/ todos. */}
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
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Foto no "palco": holofote + círculo + número gigante grounding o jogador */}
          <div className="relative order-1 h-[420px] overflow-hidden sm:h-[560px] lg:order-2">
            {/* Palco atrás do jogador */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* holofote difuso (ambiente, troca com a seleção) */}
              <div
                className="absolute left-1/2 top-[42%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: `radial-gradient(circle, ${squad.colors[1]}66, transparent 70%)` }}
              />
              {/* disco/pódio: dá um "pop" e gira de leve a cada troca de jogador */}
              <motion.div
                key={`${code}-${p.id}-disco`}
                initial={{ scale: 0.82, rotate: dir * -18, opacity: 0.5 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 13 }}
                className="absolute left-1/2 top-[46%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/15 sm:h-[24rem] sm:w-[24rem]"
                style={{ background: `radial-gradient(circle at 50% 32%, color-mix(in srgb, ${squad.colors[0]} 92%, #fff 8%), color-mix(in srgb, ${squad.colors[0]} 25%, transparent))` }}
              >
                {/* anel tracejado que gira devagar — dá vida ao disco */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-3 rounded-full border-2 border-dashed border-white/15"
                />
              </motion.div>
            </div>

            <AnimatePresence mode="wait" custom={dir}>
              {goodPhoto ? (
                <motion.div
                  key={`${code}-${p.id}-img`}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 90, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: dir * -90, scale: 0.92 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {/* número gigante (dado real) atrás do jogador */}
                  {p.number && (
                    <span className="absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 font-display text-[16rem] leading-none text-white/10 sm:text-[21rem]">
                      {p.number}
                    </span>
                  )}
                  {/* foto: alinhada à base, com fade embaixo pra dissolver o recorte */}
                  <img
                    src={p.photo ?? ""}
                    alt={p.name}
                    loading="lazy"
                    style={p.photoScale ? { transform: `scale(${p.photoScale})`, transformOrigin: "bottom center" } : undefined}
                    className="relative mx-auto h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)] [mask-image:linear-gradient(to_bottom,#000_84%,transparent)]"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`${code}-${p.id}-fallback`}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 90, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: dir * -90, scale: 0.92 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 grid place-items-center"
                >
                  <span className="-translate-y-[6%] font-display text-[11rem] leading-none text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] sm:text-[14rem]">
                    {initial}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camada de swipe: arrastar a foto pro lado troca de jogador (mobile). */}
            <motion.div
              className="absolute inset-0 z-20 touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60 || info.velocity.x < -400) paginate(1);
                else if (info.offset.x > 60 || info.velocity.x > 400) paginate(-1);
              }}
            />
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
            {index + 1} / {players.length}
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
