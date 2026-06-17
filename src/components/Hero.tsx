import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-fifa-gradient pt-32 pb-24 text-foreground"
    >
      {/* Floating elements */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-float-slow"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-10 h-56 w-56 rounded-full bg-[color:var(--fifa-blue)]/30 blur-3xl animate-float-slow"
        style={{ animationDelay: "2s" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(circle,white,transparent_70%)]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" className="text-white/40" />
        </svg>
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" /> Canadá · EUA · México · 19 de Julho
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-display text-5xl leading-[0.95] text-white sm:text-7xl lg:text-8xl"
          >
            ÁLBUM DE FIGURINHAS
            <span className="block text-[color:var(--fifa-green-deep)]">FIFA WORLD CUP 2026</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 max-w-xl text-lg text-white/90"
          >
            Colecione, troque e complete seu álbum digital. Encontre colecionadores
            perto de você e conquiste cada figurinha que falta.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#album"
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--fifa-blue)] px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-black/20 transition-all hover:scale-[1.03] hover:shadow-2xl"
            >
              Começar Agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#jogadores"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:scale-[1.03] hover:bg-white/20"
            >
              Explorar Jogadores
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-6 text-white"
          >
            {[
              { n: "48", l: "Seleções" },
              { n: "736", l: "Jogadores" },
              { n: "1.2k+", l: "Trocas/dia" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-4xl">{s.n}</div>
                <div className="text-xs uppercase tracking-widest text-white/80">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating sticker mockups */}
        <div className="relative hidden h-[500px] lg:block">
          {[
            { rot: -10, x: 0, y: 20, c: "var(--fifa-blue)", label: "BRA · 10", delay: 0 },
            { rot: 8, x: 160, y: 80, c: "var(--fifa-green-deep)", label: "ARG · 09", delay: 0.15 },
            { rot: -4, x: 60, y: 240, c: "#c2410c", label: "FRA · 07", delay: 0.3 },
            { rot: 12, x: 220, y: 280, c: "#1f2937", label: "GER · 11", delay: 0.45 },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              animate={{ opacity: 1, y: s.y, rotate: s.rot }}
              transition={{ delay: 0.4 + s.delay, type: "spring", stiffness: 60, damping: 14 }}
              whileHover={{ scale: 1.08, rotate: s.rot * 0.3 }}
              style={{ left: s.x, top: 0 }}
              className="absolute h-56 w-40 rounded-2xl border-4 border-white bg-white p-3 shadow-2xl"
            >
              <div
                className="flex h-full w-full flex-col items-center justify-between rounded-lg p-3 text-white"
                style={{ background: s.c }}
              >
                <div className="text-[10px] font-bold tracking-widest opacity-80">FIFA 2026</div>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-2xl font-display">★</div>
                <div className="font-display text-lg">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
