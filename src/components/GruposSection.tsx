import { motion } from "framer-motion";
import wc from "@/data/worldcup.json";

type Team = { name: string; flag: string; code: string; group: string };
type Row = { teamId: string; mp: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };
type Group = { name: string; rows: Row[] };

const teams = wc.teams as Record<string, Team>;
const groups = wc.groups as Group[];

export function GruposSection() {
  return (
    <section id="grupos" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl text-foreground sm:text-6xl"
          >
            GRUPOS
          </motion.h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            As 12 chaves da Copa de 2026 — 48 seleções, do Grupo A ao L. A classificação começa zerada e atualiza com os jogos.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, gi) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(gi * 0.04, 0.4), duration: 0.4 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center justify-between bg-fifa-gradient px-4 py-2.5 text-white">
                <span className="font-display text-2xl tracking-wide">GRUPO {g.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Copa 2026</span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="py-2 text-left">Seleção</th>
                    <th className="px-1.5 py-2 text-center">Pts</th>
                    <th className="px-1.5 py-2 text-center">J</th>
                    <th className="hidden px-1.5 py-2 text-center sm:table-cell">V</th>
                    <th className="hidden px-1.5 py-2 text-center sm:table-cell">E</th>
                    <th className="hidden px-1.5 py-2 text-center sm:table-cell">D</th>
                    <th className="px-3 py-2 text-center">SG</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r, i) => {
                    const t = teams[r.teamId];
                    const qualifies = i < 2; // 2 primeiros avançam
                    return (
                      <tr key={r.teamId} className="border-t border-border/70">
                        <td className="px-3 py-2.5">
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-md text-[11px] font-bold ${
                              qualifies ? "bg-[color:var(--fifa-green)] text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <img src={t.flag} alt="" className="h-3.5 w-5 rounded-[2px] object-cover ring-1 ring-black/10" />
                            <span className="truncate font-medium text-foreground">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-1.5 py-2.5 text-center font-bold text-foreground">{r.pts}</td>
                        <td className="px-1.5 py-2.5 text-center text-muted-foreground">{r.mp}</td>
                        <td className="hidden px-1.5 py-2.5 text-center text-muted-foreground sm:table-cell">{r.w}</td>
                        <td className="hidden px-1.5 py-2.5 text-center text-muted-foreground sm:table-cell">{r.d}</td>
                        <td className="hidden px-1.5 py-2.5 text-center text-muted-foreground sm:table-cell">{r.l}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--fifa-green)] align-middle" /> Os 2 primeiros de cada grupo avançam para o mata-mata.
        </p>
      </div>
    </section>
  );
}
