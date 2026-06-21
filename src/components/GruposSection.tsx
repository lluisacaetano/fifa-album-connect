import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import wc from "@/data/worldcup.json";

type Team = { name: string; name_en: string; flag: string; code: string; group: string };
type StaticRow = { teamId: string; mp: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };
type Group = { name: string; rows: StaticRow[] };
type LiveRow = { nameEn: string; rank: number; gp: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };
type DisplayRow = { pos: number; name: string; flag?: string; gp: number; w: number; d: number; l: number; gd: number; pts: number };

const teams = wc.teams as Record<string, Team>;
const groups = wc.groups as Group[];

const ESPN = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";

// Apelidos da ESPN -> nome em inglês usado nos meus dados.
const alias: Record<string, string> = {
  Czechia: "Czech Republic",
  Türkiye: "Turkey",
  "Congo DR": "Democratic Republic of the Congo",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "IR Iran": "Iran",
};
const byNameEn: Record<string, Team> = {};
Object.values(teams).forEach((t) => (byNameEn[t.name_en] = t));
const resolve = (espnName: string) => byNameEn[alias[espnName] ?? espnName];

export function GruposSection() {
  const [live, setLive] = useState<Record<string, LiveRow[]> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(ESPN);
        const data = await res.json();
        const map: Record<string, LiveRow[]> = {};
        for (const g of data.children ?? []) {
          const letter = String(g.name ?? "").replace("Group ", "").trim();
          const entries = g.standings?.entries ?? [];
          map[letter] = entries
            .map((e: any) => {
              const s: Record<string, number> = {};
              for (const x of e.stats ?? []) s[x.name] = x.value;
              return {
                nameEn: e.team?.displayName ?? "",
                rank: s.rank ?? 99,
                gp: s.gamesPlayed ?? 0,
                w: s.wins ?? 0,
                d: s.ties ?? 0,
                l: s.losses ?? 0,
                gf: s.pointsFor ?? 0,
                ga: s.pointsAgainst ?? 0,
                gd: s.pointDifferential ?? 0,
                pts: s.points ?? 0,
              };
            })
            .sort((a: LiveRow, b: LiveRow) => a.rank - b.rank);
        }
        if (alive) setLive(map);
      } catch {
        /* mantém os dados estáticos como reserva */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function rowsFor(g: Group): DisplayRow[] {
    const liveRows = live?.[g.name];
    if (liveRows && liveRows.length) {
      return liveRows.map((e, i) => {
        const t = resolve(e.nameEn);
        return { pos: i + 1, name: t?.name ?? e.nameEn, flag: t?.flag, gp: e.gp, w: e.w, d: e.d, l: e.l, gd: e.gd, pts: e.pts };
      });
    }
    return g.rows.map((r, i) => {
      const t = teams[r.teamId];
      return { pos: i + 1, name: t.name, flag: t.flag, gp: r.mp, w: r.w, d: r.d, l: r.l, gd: r.gd, pts: r.pts };
    });
  }

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
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">As 12 chaves da Copa de 2026 — 48 seleções, do Grupo A ao L.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
            {live ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--fifa-green)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--fifa-green)]" />
                </span>
                Classificação ao vivo · ESPN
              </>
            ) : (
              <span className="text-muted-foreground">Carregando classificação ao vivo…</span>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, gi) => {
            const rows = rowsFor(g);
            return (
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
                    {rows.map((r) => {
                      const qualifies = r.pos <= 2;
                      return (
                        <tr key={r.name} className="border-t border-border/70">
                          <td className="px-3 py-2.5">
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-md text-[11px] font-bold ${
                                qualifies ? "bg-[color:var(--fifa-green)] text-white" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {r.pos}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              {r.flag && <img src={r.flag} alt="" className="h-3.5 w-5 rounded-[2px] object-cover ring-1 ring-black/10" />}
                              <span className="truncate font-medium text-foreground">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-1.5 py-2.5 text-center font-bold text-foreground">{r.pts}</td>
                          <td className="px-1.5 py-2.5 text-center text-muted-foreground">{r.gp}</td>
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
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--fifa-green)] align-middle" /> Os 2 primeiros de cada grupo avançam para o mata-mata.
        </p>
      </div>
    </section>
  );
}
