import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { CityAutocomplete } from "@/components/CityAutocomplete";

export function EditProfileModal() {
  const { user, editOpen, closeEdit, updateProfileData } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editOpen && user) {
      setName(user.name || "");
      setCity(user.city || "");
      setError("");
    }
  }, [editOpen, user]);

  useEffect(() => {
    if (!editOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen, closeEdit]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (name.trim().length < 2) {
      setError("Digite seu nome.");
      return;
    }
    if (!city.trim()) {
      setError("Escolha sua cidade na lista.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateProfileData({ name: name.trim(), city: city.trim() });
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {editOpen && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <button aria-label="Fechar" onClick={closeEdit} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="group foil-sheen relative bg-fifa-gradient px-7 pb-7 pt-7 text-white">
              <span className="foil-sheen-layer" aria-hidden />
              <button onClick={closeEdit} aria-label="Fechar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35">
                <X className="h-4 w-4" />
              </button>
              <h2 id="edit-title" className="font-display text-4xl leading-none">
                EDITAR PERFIL
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/90">Atualize seu nome e a cidade que aparece no mapa de trocas.</p>
            </div>

            <form onSubmit={submit} className="space-y-4 px-7 py-6">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome</span>
                <div className="relative mt-1.5">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2" />
                </div>
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cidade</span>
                <CityAutocomplete value={city} onChange={setCity} id="edit-city" />
              </div>

              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--fifa-green)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[color:var(--fifa-green-deep)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                <Check className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
