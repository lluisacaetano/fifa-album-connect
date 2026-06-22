import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeftRight, Mail, User as UserIcon, Lock } from "lucide-react";
import { useAuth, authErrorMessage, type AuthMode } from "@/lib/auth";
import { CityAutocomplete } from "@/components/CityAutocomplete";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Senha forte: mín. 8, com minúscula, maiúscula e número.
const STRONG_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function LoginModal() {
  const { authOpen, authMode, closeAuth, register, login, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>(authMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  const isSignup = mode === "signup";

  // Ao abrir: usa o modo pedido, foca o 1º campo, e fecha no Esc.
  useEffect(() => {
    if (!authOpen) return;
    setMode(authMode);
    setError("");
    setResetMode(false);
    setResetSent(false);
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Use um e-mail válido, ex.: voce@email.com");
      return;
    }
    if (isSignup) {
      if (name.trim().length < 2) {
        setError("Digite seu nome para os outros colecionadores te reconhecerem.");
        return;
      }
      if (!city.trim()) {
        setError("Escolha sua cidade na lista.");
        return;
      }
      if (!STRONG_RE.test(password)) {
        setError("A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula e número.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não conferem.");
        return;
      }
    } else if (password.length < 1) {
      setError("Digite sua senha.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await register({ name: name.trim(), email: cleanEmail, city: city.trim(), password });
      } else {
        await login(cleanEmail, password);
      }
      setName("");
      setEmail("");
      setCity("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(authErrorMessage(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(authErrorMessage(code));
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setError("");
    setResetMode(false);
    setResetSent(false);
    setMode((m) => (m === "login" ? "signup" : "login"));
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Use um e-mail válido, ex.: voce@email.com");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(cleanEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(authErrorMessage(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
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
            className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
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
                {resetMode ? "REDEFINIR SENHA" : isSignup ? "CRIE SUA CONTA" : "ENTRE PRA TROCAR"}
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/90">
                {resetMode
                  ? "Enviamos um link no seu e-mail para você criar uma nova senha."
                  : isSignup
                    ? "Sua carteirinha de colecionador: entre no mapa e troque com quem está perto de você."
                    : "Bem-vindo de volta! Veja quem tem as figurinhas que faltam pra você."}
              </p>
            </div>

            {/* Formulário */}
            {!resetMode && (
            <form onSubmit={submit} className="space-y-4 px-7 py-6">
              <button
                type="button"
                onClick={google}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
              >
                <GoogleIcon className="h-4 w-4" />
                Continuar com Google
              </button>

              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou
                <span className="h-px flex-1 bg-border" />
              </div>

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
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cidade</span>
                  <CityAutocomplete value={city} onChange={setCity} id="signup-city" />
                </div>
              )}

              <Field label="Senha" icon={<Lock className="h-4 w-4" />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "Mín. 8 com maiúscula, minúscula e número" : "Sua senha"}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                />
              </Field>

              {isSignup && (
                <>
                  <Field label="Confirme a senha" icon={<Lock className="h-4 w-4" />}>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                    />
                  </Field>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="-mt-2 text-xs font-medium text-destructive">As senhas não conferem.</p>
                  )}
                </>
              )}

              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                <ArrowLeftRight className={`h-4 w-4 transition-transform group-hover:rotate-180 ${loading ? "animate-spin" : ""}`} />
                {loading ? (isSignup ? "Criando conta…" : "Entrando…") : isSignup ? "Criar conta e começar a trocar" : "Entrar e começar a trocar"}
              </button>

              {!isSignup && (
                <p className="-mt-1 text-center text-sm">
                  <button type="button" onClick={() => { setError(""); setResetMode(true); }} className="text-muted-foreground underline-offset-2 hover:underline">
                    Esqueci minha senha
                  </button>
                </p>
              )}

              <p className="text-center text-sm text-muted-foreground">
                {isSignup ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                <button type="button" onClick={switchMode} className="font-bold text-[color:var(--fifa-green)] underline-offset-2 hover:underline">
                  {isSignup ? "Entrar" : "Criar conta grátis"}
                </button>
              </p>
            </form>
            )}

            {resetMode && (
              <form onSubmit={sendReset} className="space-y-4 px-7 py-6">
                {resetSent ? (
                  <div className="rounded-xl bg-[color:var(--fifa-green)]/10 px-4 py-4 text-sm text-[color:var(--fifa-green)]">
                    Se existe uma conta com <strong>{email.trim()}</strong>, enviamos um link para redefinir a senha. Confira sua caixa de entrada (e o spam).
                  </div>
                ) : (
                  <>
                    <Field label="E-mail" icon={<Mail className="h-4 w-4" />}>
                      <input
                        ref={firstField}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
                      />
                    </Field>

                    {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                    >
                      <Mail className="h-4 w-4" /> {loading ? "Enviando…" : "Enviar link de redefinição"}
                    </button>
                  </>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  <button type="button" onClick={() => { setResetMode(false); setResetSent(false); setError(""); }} className="font-bold text-[color:var(--fifa-green)] underline-offset-2 hover:underline">
                    Voltar para o login
                  </button>
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 0 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
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
