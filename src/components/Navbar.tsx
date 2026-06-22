import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "#home", id: "home", label: "Home" },
  { href: "#jogadores", id: "jogadores", label: "Jogadores" },
  { href: "#selecoes", id: "selecoes", label: "Seleções" },
  { href: "#grupos", id: "grupos", label: "Grupos" },
  { href: "#partidas", id: "partidas", label: "Partidas" },
  { href: "#conectar", id: "conectar", label: "Trocas" },
  { href: "#album", id: "album", label: "Meu Álbum" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState("home");
  const { user, hydrated, openAuth, logout } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Marca o link da seção atual conforme a rolagem (a barrinha "anda" junto).
  useEffect(() => {
    const ids = links.map((l) => l.id);
    const onScroll = () => {
      const line = window.scrollY + window.innerHeight * 0.35; // linha de referência
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      {/* Barra flutuante com fundo próprio: contraste garantido sobre qualquer cor */}
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/10 bg-[color:var(--fifa-night)] px-3 py-2 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] ring-1 ring-[color:var(--fifa-yellow)]/15 transition-all duration-300 sm:px-4 ${
          scrolled ? "sm:py-1.5" : "sm:py-2.5"
        }`}
      >
        <a href="#home" className="flex items-center gap-2.5 pl-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-fifa-gradient font-display text-lg text-white shadow-md">26</span>
          <span className="hidden font-display text-xl tracking-wide sm:inline">ÁLBUM FIFA 2026</span>
        </a>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => {
            const isActive = active === l.id;
            return (
              <a
                key={l.href}
                href={l.href}
                className={`relative px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-[color:var(--fifa-yellow)]" : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-[color:var(--fifa-yellow)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 pr-0.5">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Alternar tema"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/90 transition-all hover:scale-105 hover:bg-white/10"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {hydrated && user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-fifa-gradient text-[11px] font-bold text-white">
                  {firstName.slice(0, 1)}
                </span>
                <span className="max-w-[90px] truncate text-sm font-semibold">{firstName}</span>
              </span>
              <button
                onClick={logout}
                aria-label="Sair"
                title="Sair"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/90 transition-all hover:scale-105 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuth("login")}
              className="hidden rounded-full bg-[color:var(--fifa-yellow)] px-5 py-2 text-sm font-bold text-[color:var(--fifa-green-deep)] shadow-md transition-all hover:scale-105 sm:inline-flex"
            >
              Entrar
            </button>
          )}
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-[color:var(--fifa-night)] p-3 text-white shadow-xl lg:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/10 ${
                active === l.id ? "text-[color:var(--fifa-yellow)]" : "text-white/80"
              }`}
            >
              {l.label}
            </a>
          ))}
          {hydrated && user ? (
            <div className="mt-1 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-fifa-gradient text-[11px] font-bold text-white">
                  {firstName.slice(0, 1)}
                </span>
                {firstName}
              </span>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                openAuth("login");
              }}
              className="mt-1 block w-full rounded-xl bg-[color:var(--fifa-yellow)] px-4 py-3 text-center text-sm font-bold text-[color:var(--fifa-green-deep)]"
            >
              Entrar
            </button>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}
