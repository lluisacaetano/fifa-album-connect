import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeftRight, Mail, User as UserIcon, Lock, MapPin } from "lucide-react";
import { useAuth, type AuthMode } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Fulano de Tal" a partir de fulano.de.tal@email.com (só para exibição no login).
function nameFromEmail(email: string) {
  const raw = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return raw.replace(/\b\w/g, (m) => m.toUpperCase()) || "Colecionador";
}

export function LoginModal() {
  const { authOpen, authMode, closeAuth, signIn, register, findAccount } = useAuth();
  const [mode, setMode] = useState<AuthMode>(authMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  const isSignup = mode === "signup";

  // Ao abrir: usa o modo pedido, foca o 1º campo, e fecha no Esc.
  useEffect(() => {
    if (!authOpen) return;
    setMode(authMode);
    setError("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstField.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [authOpen, authMode, closeAuth]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Use um e-mail válido, ex.: voce@email.com");
      return;
    }
    if (password.trim().length < 4) {
      setError("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    if (isSignup) {
      const cleanName = name.trim();
      if (cleanName.length < 2) {
        setError("Digite seu nome para os outros colecionadores te reconhecerem.");
        return;
      }
      register({ name: cleanName, email: cleanEmail, city: city.trim() || undefined, password: password.trim() });
    } else {
      const acc = findAccount(cleanEmail);
      signIn({ name: acc?.name ?? nameFromEmail(cleanEmail), email: cleanEmail, city: acc?.city });
    }
    setName("");
    setEmail("");
    setCity("");
    setPassword("");
  }

  function switchMode() {
    setError("");
    setMode((m) => (m === "login" ? "signup" : "login"));
  }

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          {/* Fundo escuro */}
          <button aria-label="Fechar" onClick={closeAuth} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />

          {/* Card — pacote de figurinhas */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            {/* Topo holográfico */}
            <div className="group foil-sheen relative bg-fifa-gradient px-7 pb-8 pt-7 text-white">
              <span className="foil-sheen-layer" aria-hidden />
              <button
                onClick={closeAuth}
                aria-label="Fechar"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/95 font-display text-2xl text-[color:var(--fifa-green)] shadow-md">26</span>
              <h2 id="auth-title" className="mt-4 font-display text-4xl leading-none">
                {isSignup ? "CRIE SUA CONTA" : "ENTRE PRA TROCAR"}
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/90">
                {isSignup
                  ? "Sua carteirinha de colecionador: entre no mapa e troque com quem está perto de você."
                  : "Bem-vindo de volta! Veja quem tem as figurinhas que faltam pra você."}
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={submit} className="space-y-4 px-7 py-6">
              {isSignup && (
                <Field label="Nome" icon={<UserIcon className="h-4 w-4" />}>
                  <input
                    ref={firstField}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como te chamam no rolê das trocas"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                  />
                </Field>
              )}

              <Field label="E-mail" icon={<Mail className="h-4 w-4" />}>
                <input
                  ref={isSignup ? undefined : firstField}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                />
              </Field>

              {isSignup && (
                <Field label="Cidade (opcional)" icon={<MapPin className="h-4 w-4" />}>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Onde você troca? Ex.: Belo Horizonte"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                  />
                </Field>
              )}

              <Field label="Senha" icon={<Lock className="h-4 w-4" />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "Crie uma senha" : "Sua senha"}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                />
              </Field>

              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}

              <button
                type="submit"
                className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)]"
              >
                <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:rotate-180" />
                {isSignup ? "Criar conta e começar a trocar" : "Entrar e começar a trocar"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                {isSignup ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                <button type="button" onClick={switchMode} className="font-bold text-[color:var(--fifa-green)] underline-offset-2 hover:underline">
                  {isSignup ? "Entrar" : "Criar conta grátis"}
                </button>
              </p>

              <p className="text-center text-[11px] text-muted-foreground">Demonstração — seus dados ficam só no seu navegador.</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
