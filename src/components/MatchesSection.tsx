import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";

const matches = [
  { home: "Brasil", homeFlag: "🇧🇷", away: "Marrocos", awayFlag: "🇲🇦", date: "12 Jun", time: "16:00", stadium: "MetLife Stadium · New Jersey" },
  { home: "Brasil", homeFlag: "🇧🇷", away: "Haiti", awayFlag: "🇭🇹", date: "17 Jun", time: "19:00", stadium: "SoFi Stadium · Los Angeles" },
  { home: "Brasil", homeFlag: "🇧🇷", away: "Escócia", awayFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", date: "23 Jun", time: "21:00", stadium: "Estadio Azteca · Cidade do México" },
];

export function MatchesSection() {
  return (
    <section
      id="partidas"
      className="relative overflow-hidden bg-[#2F9645] py-24 text-white"
    >
      {/* Ribbon decoration */}
      <div aria-hidden className="pointer-events-none absolute -right-20 top-0 h-full w-1/3 opacity-30">
        <div className="h-full w-full bg-[repeating-linear-gradient(35deg,transparent_0_24px,#FFDF00_24px_30px,transparent_30px_54px,#FFFFFF_54px_60px)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-6xl text-[color:var(--fifa-yellow)] sm:text-7xl"
          >
            PARTIDAS
          </motion.h2>
          <div className="mt-3 inline-block rounded-md border-2 border-[#0a2e0a] px-6 py-1.5 text-sm font-bold tracking-[0.4em]">
            COPA DO MUNDO 2026
          </div>
        </div>

        <div className="space-y-5">
          {matches.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="group relative rounded-3xl border-2 border-[color:var(--fifa-yellow)] bg-[color:var(--fifa-yellow)] p-1 shadow-[0_10px_0_color-mix(in_oklab,var(--fifa-green-deep)_60%,transparent)] transition-all hover:shadow-[0_20px_40px_-10px_color-mix(in_oklab,var(--fifa-yellow)_70%,transparent)]"
            >
              <div className="flex flex-col items-center gap-4 rounded-[20px] bg-[color:var(--fifa-yellow)] p-5 text-[color:var(--fifa-green-deep)] sm:flex-row sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{m.homeFlag}</span>
                  <span className="font-display text-3xl">{m.home}</span>
                </div>

                <div className="font-display text-2xl text-[color:var(--fifa-green-deep)]/60">X</div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl">{m.away}</span>
                  <span className="text-4xl">{m.awayFlag}</span>
                </div>

                <div className="hidden h-12 w-px bg-[color:var(--fifa-green-deep)]/20 lg:block" />

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {m.date}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {m.time}</span>
                  <span className="hidden items-center gap-1.5 md:inline-flex"><MapPin className="h-3.5 w-3.5" /> {m.stadium}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
