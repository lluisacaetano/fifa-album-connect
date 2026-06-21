import { motion } from "framer-motion";
import { nations, type Nation } from "@/data/nations";

function Pack({ nation }: { nation: Nation }) {
  const [c1, c2] = nation.colors;
  return (
    <div
      className="group foil-sheen relative h-44 w-32 shrink-0 select-none rounded-2xl border border-white/15 p-[3px] shadow-xl transition-transform duration-300 hover:-translate-y-2 hover:rotate-[-2deg] sm:h-52 sm:w-40"
      style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)` }}
      title={nation.name}
    >
      {/* selo de brilho que passa no hover */}
      <span className="foil-sheen-layer rounded-2xl" aria-hidden />

      <div className="relative flex h-full w-full flex-col items-center justify-between rounded-xl bg-black/15 p-3 backdrop-blur-[1px]">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/80">FIFA 2026</span>

        <img
          src={`https://flagcdn.com/w320/${nation.code}.png`}
          alt={`Bandeira ${nation.name}`}
          loading="lazy"
          className="h-16 w-24 rounded-md object-cover shadow-md ring-1 ring-black/20 sm:h-20 sm:w-28"
        />

        <span className="text-center font-display text-xl leading-none tracking-wide text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.4)] sm:text-2xl">
          {nation.name}
        </span>
      </div>
    </div>
  );
}

function Row({ items, reverse }: { items: Nation[]; reverse?: boolean }) {
  // duplica a lista para o loop ficar contínuo (a animação anda -50%)
  const doubled = [...items, ...items];
  return (
    <div className="flex w-max marquee-track animate-marquee gap-4" style={reverse ? { animationDirection: "reverse" } : undefined}>
      {doubled.map((n, i) => (
        <Pack key={`${n.code}-${i}`} nation={n} />
      ))}
    </div>
  );
}

export function SelecoesSection() {
  const half = Math.ceil(nations.length / 2);
  const topRow = nations.slice(0, half);
  const bottomRow = nations.slice(half);

  return (
    <section
      id="selecoes"
      className="relative overflow-hidden py-24 text-white"
      style={{ background: "var(--fifa-night)" }}
    >
      {/* leve textura de luz no fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--fifa-green) 40%, transparent), transparent)" }}
      />

      <div className="relative mx-auto mb-12 max-w-7xl px-4 text-center sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-6xl text-[color:var(--fifa-yellow)] sm:text-7xl"
        >
          SELEÇÕES
        </motion.h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
          As {nations.length} seleções da Copa de 2026, cada uma nas suas cores. Passe o mouse para pausar e encontrar a sua.
        </p>
      </div>

      {/* duas faixas correndo em sentidos opostos */}
      <div
        className="flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        style={{ ["--marquee-duration" as string]: "70s" }}
      >
        <Row items={topRow} />
        <Row items={bottomRow} reverse />
      </div>
    </section>
  );
}
