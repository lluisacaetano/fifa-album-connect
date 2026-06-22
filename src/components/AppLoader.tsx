import { useEffect, useState } from "react";

// Splash que cobre o "flash" entre o HTML do servidor e a hidratação no cliente.
// É renderizado no SSR (aparece de cara) e some assim que o app monta.
export function AppLoader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] grid place-items-center bg-[color:var(--fifa-night)] transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-20 w-20 animate-pulse place-items-center rounded-2xl bg-fifa-gradient font-display text-4xl text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]">26</span>
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">Carregando</span>
      </div>
    </div>
  );
}
