import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, User as UserIcon, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { Avatar } from "@/components/Avatar";

// Recorta no centro e reduz a imagem para um quadrado leve (guardado no Firestore).
function resizeToDataUrl(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function EditProfileModal() {
  const { user, editOpen, needsCity, closeEdit, updateProfileData } = useAuth();
  const forced = needsCity; // login sem cidade (ex.: Google) — precisa completar
  const open = editOpen || forced;

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && user) {
      setName(user.name || "");
      setCity(user.city || "");
      setPhoto(user.photo);
      setError("");
    }
  }, [open, user]);

  useEffect(() => {
    if (!open || forced) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, forced, closeEdit]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await resizeToDataUrl(file));
    } catch {
      setError("Não consegui ler essa imagem. Tente outra.");
    }
  }

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
      await updateProfileData({ name: name.trim(), city: city.trim(), photo });
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <button aria-label="Fechar" onClick={() => !forced && closeEdit()} className="absolute inset-0 cursor-default bg-[color:var(--fifa-night)]/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="group foil-sheen relative bg-fifa-gradient px-7 pb-7 pt-7 text-white">
              <span className="foil-sheen-layer" aria-hidden />
              {!forced && (
                <button onClick={closeEdit} aria-label="Fechar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35">
                  <X className="h-4 w-4" />
                </button>
              )}
              <h2 id="edit-title" className="font-display text-4xl leading-none">
                {forced ? "QUASE LÁ!" : "EDITAR PERFIL"}
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/90">
                {forced ? "Falta só sua cidade para você entrar no mapa e trocar com quem está perto." : "Atualize sua foto, nome e a cidade que aparece no mapa."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4 px-7 py-6">
              {/* Foto */}
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => fileRef.current?.click()} className="relative" aria-label="Trocar foto">
                  <Avatar name={name || "?"} photo={photo} size={64} className="ring-2 ring-[color:var(--fifa-green)]/30" />
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[color:var(--fifa-green)] text-white shadow">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                </button>
                <div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-[color:var(--fifa-green)] hover:underline">
                    {photo ? "Trocar foto" : "Adicionar foto"}
                  </button>
                  {photo && (
                    <button type="button" onClick={() => setPhoto(undefined)} className="ml-3 text-sm text-muted-foreground hover:underline">
                      Remover
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
              </div>

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
                <Check className="h-4 w-4" /> {saving ? "Salvando…" : forced ? "Entrar no mapa" : "Salvar alterações"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
