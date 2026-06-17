import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Menu, X } from "lucide-react";

const links = [
  { href: "#home", label: "Home" },
  { href: "#jogadores", label: "Jogadores" },
  { href: "#partidas", label: "Partidas" },
  { href: "#conectar", label: "Trocas" },
  { href: "#album", label: "Meu Álbum" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#home" className="flex items-center gap-2 font-display text-2xl tracking-wide">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-fifa-gradient text-white font-bold">26</span>
          <span className="hidden sm:inline">ÁLBUM FIFA 2026</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <span className="relative z-10">{l.label}</span>
              <span className="absolute inset-0 -z-0 scale-90 rounded-full bg-foreground/5 opacity-0 transition-all hover:opacity-100 hover:scale-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Alternar tema"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 transition-all hover:scale-105"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href="#conectar"
            className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:scale-105 md:inline-flex"
          >
            Conectar
          </a>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden"
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
          className="mx-4 mt-2 rounded-2xl border border-border bg-card p-3 shadow-xl md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
