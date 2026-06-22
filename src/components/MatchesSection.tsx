import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Minus, Plus, Lock, ChevronDown, Check } from "lucide-react";
import wc from "@/data/worldcup.json";
import { useAuth } from "@/lib/auth";
import { listenPredictions, savePrediction, type Prediction } from "@/lib/predictions";

type Team = { name: string; name_en: string; flag: string; code: string };
type Stadium = { name: string; city: string };
type Match = {
  id: number;
  iso: string;
  date: string;
  time: string;
  matchday: number;
  stage: string;
  group: string | null;
  knockout: boolean;
  homeId: string | null;
  awayId: string | null;
  homeLabel: string;
  awayLabel: string;
  stadiumId: string;
};

const teams = wc.teams as Record<string, Team>;
const stadiums = wc.stadiums as Record<string, Stadium>;
const BRAZIL_ID = Object.keys(teams).find((id) => teams[id].name_en === "Brazil") ?? "all";
const matches = (wc.matches as Match[]).slice().sort((a, b) => a.iso.localeCompare(b.iso));

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return `${day} de ${MONTHS[m - 1]} de ${y}`;
};

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719";
const alias: Record<string, string> = {
  Czechia: "Czech Republic",
  Türkiye: "Turkey",
  "Congo DR": "Democratic Republic of the Congo",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "IR Iran": "Iran",
};
const canon = (n: string) => alias[n] ?? n;

type Score = { h: string; a: string; state: string; detail: string };
const STAR_KEY = "partidas-marcadas";

export function MatchesSection() {
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [country, setCountry] = useState(BRAZIL_ID);
  const [phase, setPhase] = useState<"all" | "groups" | "knockout">("all");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [starred, setStarred] = useState<Set<number>>(new Set());

  // palpites
  const { user, openAuth } = useAuth();
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { h: number; a: number }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => listenPredictions(setPreds), []);

  // jogos marcados (localStorage)
  useEffect(() => {
    try {
      const s = localStorage.getItem(STAR_KEY);
      if (s) setStarred(new Set(JSON.parse(s) as number[]));
    } catch {
      /* ignora */
    }
  }, []);

  // placares ao vivo (ESPN)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(ESPN);
        const data = await res.json();
        const map: Record<string, Score> = {};
        for (const e of data.events ?? []) {
          const comp = e.competitions?.[0];
          const cs = comp?.competitors ?? [];
          const home = cs.find((c: any) => c.homeAway === "home");
          const away = cs.find((c: any) => c.homeAway === "away");
          if (!home || !away) continue;
          const st = e.status?.type ?? {};
          const sc: Score = { h: home.score, a: away.score, state: st.state, detail: st.shortDetail ?? "" };
          map[`${canon(home.team.displayName)}|${canon(away.team.displayName)}`] = sc;
        }
        if (alive) setScores(map);
      } catch {
        /* sem placares: mostra horário */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function toggleStar(id: number) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STAR_KEY, JSON.stringify([...next]));
      } catch {
        /* ignora */
      }
      return next;
    });
  }

  function scoreFor(m: Match): Score | null {
    if (!m.homeId || !m.awayId) return null;
    const h = teams[m.homeId].name_en;
    const a = teams[m.awayId].name_en;
    const direct = scores[`${h}|${a}`];
    if (direct) return direct;
    const rev = scores[`${a}|${h}`]; // ESPN com mando invertido: troca o placar
    if (rev) return { h: rev.a, a: rev.h, state: rev.state, detail: rev.detail };
    return null;
  }

  // ---- Palpites ----
  const kickoffMs = (m: Match) => new Date(m.iso.replace(" ", "T")).getTime();
  const canPredict = (m: Match) => !!m.homeId && !!m.awayId && now > 0 && now < kickoffMs(m) - 3_600_000;
  const myPred = (id: number) => (user ? preds.find((p) => p.matchId === id && p.uid === user.uid) : undefined);
  const draftOf = (m: Match) => {
    const d = drafts[m.id];
    if (d) return d;
    const mp = myPred(m.id);
    return mp ? { h: mp.h, a: mp.a } : { h: 0, a: 0 };
  };
  const setDraft = (id: number, h: number, a: number) => setDrafts((p) => ({ ...p, [id]: { h: Math.max(0, Math.min(20, h)), a: Math.max(0, Math.min(20, a)) } }));
  async function savePalpite(m: Match) {
    if (!user) {
      openAuth("signup");
      return;
    }
    const d = draftOf(m);
    setSavingId(m.id);
    try {
      await savePrediction({ matchId: m.id, uid: user.uid, name: user.name, h: d.h, a: d.a });
    } finally {
      setSavingId(null);
    }
  }
  function chartFor(id: number) {
    const map = new Map<string, number>();
    let total = 0;
    for (const p of preds)
      if (p.matchId === id) {
        const key = `${p.h}×${p.a}`;
        map.set(key, (map.get(key) ?? 0) + 1);
        total++;
      }
    const rows = [...map.entries()].map(([s, n]) => ({ s, n })).sort((a, b) => b.n - a.n);
    return { rows, total, max: rows[0]?.n ?? 1 };
  }

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (phase === "groups" && m.knockout) return false;
      if (phase === "knockout" && !m.knockout) return false;
      if (country !== "all" && m.homeId !== country && m.awayId !== country) return false;
      if (onlyStarred && !starred.has(m.id)) return false;
      return true;
    });
  }, [country, phase, onlyStarred, starred]);

  // agrupa por data
  const byDate = useMemo(() => {
    const groups: { date: string; items: Match[] }[] = [];
    for (const m of filtered) {
      const last = groups[groups.length - 1];
      if (last && last.date === m.date) last.items.push(m);
      else groups.push({ date: m.date, items: [m] });
    }
    return groups;
  }, [filtered]);

  const countryOptions = Object.entries(teams)
    .map(([id, t]) => ({ id, name: t.name }))
    .sort((a, z) => a.name.localeCompare(z.name, "pt"));

  return (
    <section id="partidas" className="relative overflow-hidden bg-[#2F9645] py-14 text-white sm:py-24">
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-6xl text-[color:var(--fifa-yellow)] sm:text-7xl"
          >
            PARTIDAS
          </motion.h2>
          <p className="mt-2 text-sm text-white/80">Todos os 104 jogos da Copa de 2026 · placar ao vivo · marque os que quer assistir.</p>
        </div>

        {/* Controles */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--fifa-green-deep)] outline-none"
          >
            <option value="all">🌎 Todas as seleções</option>
            {countryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex overflow-hidden rounded-full border border-white/20">
            {[
              { k: "all", l: "Todas" },
              { k: "groups", l: "Grupos" },
              { k: "knockout", l: "Mata-mata" },
            ].map((p) => (
              <button
                key={p.k}
                onClick={() => setPhase(p.k as typeof phase)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${phase === p.k ? "bg-white text-[color:var(--fifa-green-deep)]" : "text-white hover:bg-white/10"}`}
              >
                {p.l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOnlyStarred((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              onlyStarred ? "border-[color:var(--fifa-yellow)] bg-[color:var(--fifa-yellow)] text-[color:var(--fifa-green-deep)]" : "border-white/20 text-white hover:bg-white/10"
            }`}
          >
            <Star className={`h-4 w-4 ${onlyStarred ? "fill-current" : ""}`} />
            Marcados
          </button>
        </div>

        {byDate.length === 0 ? (
          <p className="py-12 text-center text-white/80">Nenhum jogo com esses filtros.</p>
        ) : (
          <div className="space-y-7">
            {byDate.map((grp) => (
              <div key={grp.date}>
                <h3 className="mb-3 font-display text-xl tracking-wide text-[color:var(--fifa-yellow)]">{fmtDate(grp.date)}</h3>
                <div className="space-y-2.5">
                  {grp.items.map((m) => {
                    const raw = scoreFor(m);
                    // ESPN: "pre" = agendado, "in" = ao vivo, "post" = encerrado.
                    // Só trata como placar quando já começou (evita "0-0 encerrado" em jogo futuro).
                    const started = raw?.state === "in" || raw?.state === "post";
                    const sc = started ? raw : null;
                    const live = raw?.state === "in";
                    const finished = raw?.state === "post";
                    const home = m.homeId ? teams[m.homeId] : null;
                    const away = m.awayId ? teams[m.awayId] : null;
                    const starOn = starred.has(m.id);
                    const hasTeams = !!(home && away);
                    const open = openId === m.id;
                    const d = draftOf(m);
                    const mine = myPred(m.id);
                    const canP = canPredict(m);
                    const { rows, total, max } = chartFor(m.id);
                    const resultKey = finished && sc ? `${sc.h}×${sc.a}` : null;
                    return (
                      <div key={m.id} className="overflow-hidden rounded-2xl bg-white text-[color:var(--fifa-green-deep)] shadow-sm">
                        <div className={`flex items-center gap-3 p-3 sm:gap-4 sm:p-4 ${hasTeams ? "cursor-pointer" : ""}`} onClick={() => hasTeams && setOpenId(open ? null : m.id)}>
                          {/* casa */}
                          <div className="flex flex-1 items-center justify-end gap-2 text-right">
                            <span className="truncate font-display text-lg sm:text-xl">{home ? home.name : m.homeLabel}</span>
                            {home && <img src={home.flag} alt="" className="h-5 w-7 rounded-[2px] object-cover ring-1 ring-black/10" />}
                          </div>

                          {/* placar / horário */}
                          <div className="flex min-w-[64px] flex-col items-center">
                            {sc ? (
                              <span className="font-display text-2xl leading-none">
                                {sc.h}
                                <span className="mx-1 text-base">-</span>
                                {sc.a}
                              </span>
                            ) : (
                              <span className="font-display text-xl leading-none text-[color:var(--fifa-green)]">{m.time}</span>
                            )}
                            <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider ${live ? "text-red-600" : "text-muted-foreground"}`}>
                              {live ? "● ao vivo" : finished ? "encerrado" : m.stage}
                            </span>
                          </div>

                          {/* fora */}
                          <div className="flex flex-1 items-center gap-2">
                            {away && <img src={away.flag} alt="" className="h-5 w-7 rounded-[2px] object-cover ring-1 ring-black/10" />}
                            <span className="truncate font-display text-lg sm:text-xl">{away ? away.name : m.awayLabel}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(m.id);
                            }}
                            aria-label={starOn ? "Desmarcar jogo" : "Marcar jogo"}
                            className="shrink-0 text-[color:var(--fifa-green)] transition-transform hover:scale-110"
                          >
                            <Star className={`h-5 w-5 ${starOn ? "fill-[color:var(--fifa-yellow)] text-[color:var(--fifa-yellow)]" : ""}`} />
                          </button>
                          {hasTeams && <ChevronDown className={`h-5 w-5 shrink-0 text-[color:var(--fifa-green)]/60 transition-transform ${open ? "rotate-180" : ""}`} />}
                        </div>

                        <AnimatePresence initial={false}>
                          {open && hasTeams && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="border-t border-black/5">
                              <div className="space-y-4 px-4 py-4">
                                {/* Seu palpite */}
                                {canP ? (
                                  <div>
                                    <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[color:var(--fifa-green)]">Seu palpite</div>
                                    <div className="flex items-center justify-center gap-3">
                                      <PalpiteStepper value={d.h} onChange={(v) => setDraft(m.id, v, d.a)} />
                                      <span className="font-display text-xl text-black/30">×</span>
                                      <PalpiteStepper value={d.a} onChange={(v) => setDraft(m.id, d.h, v)} />
                                      <button
                                        onClick={() => savePalpite(m)}
                                        disabled={savingId === m.id}
                                        className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--fifa-green)] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[color:var(--fifa-green-deep)] disabled:opacity-60"
                                      >
                                        {mine ? <Check className="h-4 w-4" /> : null}
                                        {savingId === m.id ? "Salvando…" : !user ? "Entrar para palpitar" : mine ? "Atualizar" : "Salvar"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                    {mine ? <>Palpites encerrados · seu palpite: <strong className="text-[color:var(--fifa-green-deep)]">{mine.h}×{mine.a}</strong></> : "Palpites encerrados (fecham 1h antes do jogo)"}
                                  </div>
                                )}

                                {/* Gráfico de palpites */}
                                <div>
                                  <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{total} palpite{total === 1 ? "" : "s"} da galera</div>
                                  {total === 0 ? (
                                    <p className="text-sm text-muted-foreground">Ninguém palpitou ainda. Seja o primeiro!</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {rows.slice(0, 7).map((r) => {
                                        const isResult = r.s === resultKey;
                                        const isMine = mine && `${mine.h}×${mine.a}` === r.s;
                                        return (
                                          <div key={r.s} className="flex items-center gap-2">
                                            <span className={`w-9 text-right font-display text-base ${isResult ? "text-[color:var(--fifa-green)]" : ""}`}>{r.s}</span>
                                            <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/5">
                                              <div
                                                className={`h-full rounded-full ${isResult ? "bg-[color:var(--fifa-green)]" : "bg-[color:var(--fifa-green)]/45"}`}
                                                style={{ width: `${Math.max(8, (r.n / max) * 100)}%` }}
                                              />
                                            </div>
                                            <span className="w-16 text-right text-xs text-muted-foreground">
                                              {r.n} · {Math.round((r.n / total) * 100)}%{isMine ? " ⬅" : ""}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {resultKey && <p className="mt-2 text-xs font-semibold text-[color:var(--fifa-green)]">Resultado: {resultKey} (em verde)</p>}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-white/70">
          <MapPin className="h-3.5 w-3.5" /> Sedes no Canadá, México e Estados Unidos · placares atualizados pela ESPN.
        </p>
      </div>
    </section>
  );
}

function PalpiteStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="-1" className="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-[color:var(--fifa-green-deep)] transition-colors hover:bg-black/10">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-7 text-center font-display text-2xl">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(20, value + 1))} aria-label="+1" className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--fifa-green)]/15 text-[color:var(--fifa-green-deep)] transition-colors hover:bg-[color:var(--fifa-green)]/25">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
