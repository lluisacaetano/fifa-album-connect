import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import neymarAsset from "@/assets/neymar.png.asset.json";
import endrickAsset from "@/assets/endrick.png.asset.json";
import vinijrAsset from "@/assets/vinijr.png.asset.json";
import rodrygoImg from "@/assets/rodrygo.png";
import alissonImg from "@/assets/alisson.png";

type Player = {
  name: string;
  team: string;
  club: string;
  position: string;
  age: number;
  number: string;
  image: string;
  description: string;
  stats: { label: string; value: string }[];
};

const players: Player[] = [
  {
    name: "NEYMAR",
    team: "Brasil",
    club: "Santos FC",
    position: "Meia-atacante",
    age: 34,
    number: "10",
    image: neymarAsset.url,
    description:
      "Neymar da Silva Santos Júnior é um futebolista brasileiro que atua como meia-atacante. Revelado pelo Santos, conquistou Libertadores, Copa do Brasil e o prêmio Puskás. Em 2013 foi vendido ao Barcelona na maior transferência do futebol brasileiro.",
    stats: [
      { label: "Gols", value: "437" },
      { label: "Assist.", value: "265" },
      { label: "Jogos", value: "812" },
    ],
  },
  {
    name: "VINI JR",
    team: "Brasil",
    club: "Real Madrid",
    position: "Ponta-esquerda",
    age: 25,
    number: "07",
    image: vinijrAsset.url,
    description:
      "Vinícius José Paixão de Oliveira Júnior, conhecido como Vini Jr., é ponta-esquerda do Real Madrid. Marcou o gol do título da Champions de 2022 e é um dos principais nomes da nova geração brasileira.",
    stats: [
      { label: "Gols", value: "118" },
      { label: "Assist.", value: "92" },
      { label: "Jogos", value: "324" },
    ],
  },
  {
    name: "ENDRICK",
    team: "Brasil",
    club: "Real Madrid",
    position: "Atacante",
    age: 19,
    number: "09",
    image: endrickAsset.url,
    description:
      "Endrick Felipe Moreira de Sousa é uma das maiores promessas do futebol mundial. Revelado pelo Palmeiras, foi contratado pelo Real Madrid e disputa Copa do Mundo aos 19 anos.",
    stats: [
      { label: "Gols", value: "47" },
      { label: "Assist.", value: "18" },
      { label: "Jogos", value: "112" },
    ],
  },
  {
    name: "RODRYGO",
    team: "Brasil",
    club: "Real Madrid",
    position: "Atacante",
    age: 24,
    number: "11",
    image: rodrygoImg,
    description:
      "Rodrygo Silva de Goes é um dos pilares ofensivos da Seleção. Formado pelo Santos, brilha pelo Real Madrid ao lado de Vini Jr. com sua técnica e finalização precisa.",
    stats: [
      { label: "Gols", value: "82" },
      { label: "Assist.", value: "54" },
      { label: "Jogos", value: "267" },
    ],
  },
  {
    name: "ALISSON",
    team: "Brasil",
    club: "Liverpool",
    position: "Goleiro",
    age: 33,
    number: "01",
    image: alissonImg,
    description:
      "Alisson Becker é considerado um dos melhores goleiros do mundo. Pelo Liverpool conquistou Champions e Premier League, e é titular absoluto da Seleção Brasileira.",
    stats: [
      { label: "Defesas", value: "1.3k" },
      { label: "Sem sofrer", value: "184" },
      { label: "Jogos", value: "498" },
    ],
  },
];

export function PlayersCarousel() {
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0]);
  const p = players[index];

  const paginate = (delta: number) => {
    setIndex(([i]) => {
      const next = (i + delta + players.length) % players.length;
      return [next, delta];
    });
  };

  return (
    <section id="jogadores" className="relative overflow-hidden bg-[color:var(--fifa-yellow)] py-20">
      {/* Star scribbles */}
      <svg className="pointer-events-none absolute left-4 top-10 h-24 w-24 text-[color:var(--fifa-green)]/40" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 5l10 30h32l-26 19 10 30-26-19-26 19 10-30L8 35h32z" />
      </svg>
      <svg className="pointer-events-none absolute left-20 top-32 h-12 w-12 text-[color:var(--fifa-green)]/30" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 5l10 30h32l-26 19 10 30-26-19-26 19 10-30L8 35h32z" />
      </svg>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl text-[color:var(--fifa-green-deep)] sm:text-6xl"
          >
            JOGADORES
          </motion.h2>
          <div className="mt-2 inline-block rounded-md bg-[color:var(--fifa-green)] px-8 py-2 font-display text-2xl tracking-[0.5em] text-white">
            BRASIL
          </div>
        </div>

        <div className="relative grid min-h-[520px] items-center gap-6 lg:grid-cols-2">
          {/* Text side */}
          <div className="relative">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={p.name + "-text"}
                custom={dir}
                initial={{ opacity: 0, x: dir * -80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * 80 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <h3 className="font-display text-7xl text-white drop-shadow-[3px_3px_0_color-mix(in_oklab,var(--fifa-green-deep)_50%,transparent)] sm:text-8xl">
                  {p.name}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                  <span className="rounded-full bg-[color:var(--fifa-green)] px-3 py-1 text-white">{p.position}</span>
                  <span className="rounded-full bg-[color:var(--fifa-blue)] px-3 py-1 text-white">#{p.number}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-[color:var(--fifa-green-deep)]">{p.club}</span>
                  <span className="rounded-full border border-[color:var(--fifa-green-deep)] px-3 py-1 text-[color:var(--fifa-green-deep)]">{p.age} anos</span>
                </div>

                <p className="mt-5 max-w-xl text-sm leading-relaxed text-[color:var(--fifa-green-deep)] sm:text-base">
                  {p.description}
                </p>

                <div className="mt-6 grid max-w-md grid-cols-3 gap-3">
                  {p.stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border-2 border-[color:var(--fifa-green-deep)]/20 bg-white/60 p-3 text-center backdrop-blur">
                      <div className="font-display text-2xl text-[color:var(--fifa-green-deep)]">{s.value}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--fifa-green-deep)]/70">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Image side */}
          <div className="relative h-[420px] sm:h-[520px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.img
                key={p.name + "-img"}
                src={p.image}
                alt={p.name}
                custom={dir}
                initial={{ opacity: 0, x: dir * 120, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: dir * -120, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-contain"
                loading="lazy"
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={() => paginate(-1)}
            aria-label="Anterior"
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-[color:var(--fifa-green-deep)] shadow-lg transition-all hover:scale-110 hover:bg-[color:var(--fifa-green)] hover:text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2">
            {players.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex([i, i > index ? 1 : -1])}
                aria-label={`Ir para ${players[i].name}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-[color:var(--fifa-green-deep)]" : "w-2.5 bg-[color:var(--fifa-green-deep)]/30"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => paginate(1)}
            aria-label="Próximo"
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-[color:var(--fifa-green-deep)] shadow-lg transition-all hover:scale-110 hover:bg-[color:var(--fifa-green)] hover:text-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
