import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Minus, Plus, Check, Clock, Users, Lock } from "lucide-react";
import wc from "@/data/worldcup.json";
import { useAuth } from "@/lib/auth";
import { listenPredictions, savePrediction, scorePrediction, type Prediction } from "@/lib/predictions";

type Team = { name: string; name_en: string; flag: string; code: string };
type Match = {
  id: number;
  iso: string;
  date: string;
  time: string;
  stage: string;
  group: string | null;
  knockout: boolean;
  homeId: string | null;
  awayId: string | null;
  homeLabel: string;
  awayLabel: string;
};

const teams = wc.teams as Record<string, Team>;
const matches = (wc.matches as Match[]).slice().sort((a, b) => a.iso.localeCompare(b.iso));

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719";
const alias: Record<string, string> = { Czechia: "Czech Republic", Türkiye: "Turkey", "Congo DR": "Democratic Republic of the Congo", "Bosnia-Herzegovina": "Bosnia and Herzegovina", "IR Iran": "Iran" };
const canon = (n: string) => alias[n] ?? n;
type Score = { h: number; a: number; state: string };

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function fmtWhen(iso: string) {
  const [datePart, timePart] = iso.split(" ");
  const [, m, day] = datePart.split("-").map(Number);
  return `${day} ${MONTHS[m - 1]} · ${timePart}`;
}
const kickoffMs = (m: Match) => new Date(m.iso.replace(" ", "T")).getTime();

export function PalpitesSection() {
  const { user, openAuth } = useAuth();
  const [tab, setTab] = useState<"proximos" | "ranking">("proximos");
  const [now, setNow] = useState(0);
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { h: number; a: number }>>({});
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => listenPredictions(setPreds), []);

  // Resultados finais (ESPN) para o ranking.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(ESPN);
        const data = await res.json();
        const map: Record<string, Score> = {};
        for (const e of data.events ?? []) {
          const cs = e.competitions?.[0]?.competitors ?? [];
          const home = cs.find((c: any) => c.homeAway === "home");
          const away = cs.find((c: any) => c.homeAway === "away");
          if (!home || !away) continue;
          map[`${canon(home.team.displayName)}|${canon(away.team.displayName)}`] = { h: Number(home.score), a: Number(away.score), state: e.status?.type?.state ?? "" };
        }
        if (alive) setScores(map);
      } catch {
        /* sem placares */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function resultFor(m: Match): Score | null {
    if (!m.homeId || !m.awayId) return null;
    const h = teams[m.homeId].name_en;
    const a = teams[m.awayId].name_en;
    const d = scores[`${h}|${a}`];
    if (d) return d;
    const r = scores[`${a}|${h}`];
    if (r) return { h: r.a, a: r.h, state: r.state };
    return null;
  }

  const canPredict = (m: Match) => now > 0 && now < kickoffMs(m) - 3_600_000;

  // Jogos da semana (com times definidos); se vazio, próximos 12.
  const week = useMemo(() => {
    if (!now) return [];
    const limit = now + 7 * 24 * 3_600_000;
    const withTeams = matches.filter((m) => m.homeId && m.awayId && kickoffMs(m) > now);
    const inWeek = withTeams.filter((m) => kickoffMs(m) <= limit);
    return inWeek.length ? inWeek : withTeams.slice(0, 12);
  }, [now]);

  const myPred = (id: number) => (user ? preds.find((p) => p.matchId === id && p.uid === user.uid) : undefined);
  const draftOf = (m: Match) => {
    const d = drafts[m.id];
    if (d) return d;
    const mp = myPred(m.id);
    return mp ? { h: mp.h, a: mp.a } : { h: 0, a: 0 };
  };
  const setDraft = (id: number, h: number, a: number) => setDrafts((p) => ({ ...p, [id]: { h: Math.max(0, Math.min(20, h)), a: Math.max(0, Math.min(20, a)) } }));

  async function save(m: Match) {
    if (!user) {
      openAuth("signup");
      return;
    }
    const d = draftOf(m);
    setSaving(m.id);
    try {
      await savePrediction({ matchId: m.id, uid: user.uid, name: user.name, h: d.h, a: d.a });
    } finally {
      setSaving(null);
    }
  }

  // Palpites de um jogo agrupados por placar (mais palpitados primeiro).
  function grouped(id: number): { score: string; n: number }[] {
    const map = new Map<string, number>();
    for (const p of preds) if (p.matchId === id) map.set(`${p.h}×${p.a}`, (map.get(`${p.h}×${p.a}`) ?? 0) + 1);
    return [...map.entries()].map(([score, n]) => ({ score, n })).sort((a, b) => b.n - a.n);
  }

  // Ranking: soma de pontos por palpiteiro nos jogos já encerrados.
  const board = useMemo(() => {
    const agg = new Map<string, { name: string; pts: number; exact: number; games: number }>();
    for (const p of preds) {
      const m = matches.find((x) => x.id === p.matchId);
      if (!m) continue;
      const res = resultFor(m);
      if (!res || res.state !== "post") continue;
      const pts = scorePrediction(p, res);
      const cur = agg.get(p.uid) ?? { name: p.name, pts: 0, exact: 0, games: 0 };
      cur.pts += pts;
      cur.games += 1;
      if (pts === 3) cur.exact += 1;
      cur.name = p.name;
      agg.set(p.uid, cur);
    }
    return [...agg.values()].sort((a, b) => b.pts - a.pts || b.exact - a.exact).slice(0, 20);
  }, [preds, scores]);

  return (
    <section id="palpites" className="relative overflow-hidden py-14 text-white sm:py-24" style={{ background: "linear-gradient(160deg, #0b6b3a 0%, #04140b 95%)" }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-7 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-6xl text-[color:var(--fifa-yellow)] sm:text-7xl">
            PALPITES
          </motion.h2>
          <p className="mt-2 text-sm text-white/80">Crave o placar dos jogos da semana — vale até 1h antes da bola rolar. Quem acerta mais sobe no ranking.</p>
        </div>

        <div className="mb-7 flex justify-center">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1">
            {[
              { k: "proximos" as const, l: "Próximos jogos" },
              { k: "ranking" as const, l: "Ranking" },
            ].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${tab === t.k ? "bg-white text-[color:var(--fifa-green-deep)] shadow" : "text-white/80 hover:text-white"}`}>
                {t.k === "ranking" && <Trophy className="h-3.5 w-3.5" />}
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {tab === "proximos" ? (
          <div className="space-y-3">
            {week.length === 0 ? (
              <p className="py-12 text-center text-sm text-white/70">Nenhum jogo nos próximos dias.</p>
            ) : (
              week.map((m) => {
                const d = draftOf(m);
                const mine = myPred(m.id);
                const open = canPredict(m);
                const g = grouped(m.id);
                const total = g.reduce((s, x) => s + x.n, 0);
                const home = teams[m.homeId!];
                const away = teams[m.awayId!];
                return (
                  <div key={m.id} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-white/60">
                      <span>{m.stage}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmtWhen(m.iso)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
                        <span className="truncate font-display text-lg sm:text-xl">{home.name}</span>
                        <img src={home.flag} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-black/20" />
                      </div>

                      <Stepper value={d.h} disabled={!open} onChange={(v) => setDraft(m.id, v, d.a)} />
                      <span className="font-display text-xl text-white/50">×</span>
                      <Stepper value={d.a} disabled={!open} onChange={(v) => setDraft(m.id, d.h, v)} />

                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <img src={away.flag} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-black/20" />
                        <span className="truncate font-display text-lg sm:text-xl">{away.name}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      {open ? (
                        <button
                          onClick={() => save(m)}
                          disabled={saving === m.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--fifa-yellow)] px-5 py-2 text-sm font-bold text-[color:var(--fifa-green-deep)] transition-all hover:scale-[1.03] disabled:opacity-60"
                        >
                          {mine ? <Check className="h-4 w-4" /> : null}
                          {saving === m.id ? "Salvando…" : mine ? "Atualizar palpite" : "Salvar palpite"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/70">
                          <Lock className="h-3.5 w-3.5" /> Palpites encerrados
                        </span>
                      )}
                      {mine && <span className="text-xs text-white/70">Seu palpite: <strong className="text-[color:var(--fifa-yellow)]">{mine.h}×{mine.a}</strong></span>}
                    </div>

                    {total > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/55">
                          <Users className="h-3.5 w-3.5" /> {total} palpite{total > 1 ? "s" : ""}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {g.slice(0, 6).map((x) => (
                            <span key={x.score} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold">
                              {x.score} <span className="text-white/55">· {x.n}</span>
                            </span>
                          ))}
                          {g.length > 6 && <span className="px-1 text-xs text-white/55">+{g.length - 6}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-sm">
            {board.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-white/70">Ainda não há jogos encerrados com palpites. Volte depois das partidas!</p>
            ) : (
              board.map((b, i) => (
                <div key={b.name + i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === 0 ? "bg-[color:var(--fifa-yellow)]/15" : ""}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-lg ${i < 3 ? "bg-[color:var(--fifa-yellow)] text-[color:var(--fifa-green-deep)]" : "bg-white/10 text-white/80"}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{b.name}</span>
                  <span className="text-xs text-white/60">{b.exact} exatos · {b.games} jogos</span>
                  <span className="font-display text-2xl text-[color:var(--fifa-yellow)]">{b.pts}</span>
                </div>
              ))
            )}
            <p className="px-4 py-3 text-center text-[11px] text-white/45">Placar exato = 3 pts · acertou o vencedor/empate = 1 pt</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Stepper({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <button type="button" disabled={disabled} onClick={() => onChange(value + 1)} aria-label="+1" className="grid h-6 w-8 place-items-center rounded-t-lg bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-40">
        <Plus className="h-3.5 w-3.5" />
      </button>
      <span className="grid h-9 w-10 place-items-center bg-white/10 font-display text-2xl">{value}</span>
      <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} aria-label="-1" className="grid h-6 w-8 place-items-center rounded-b-lg bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-40">
        <Minus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
