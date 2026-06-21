import { MapPin, CalendarDays, Heart } from "lucide-react";

const links = [
  { href: "#jogadores", label: "Jogadores" },
  { href: "#selecoes", label: "Seleções" },
  { href: "#grupos", label: "Grupos" },
  { href: "#partidas", label: "Partidas" },
  { href: "#conectar", label: "Trocas" },
  { href: "#album", label: "Meu Álbum" },
];

const stats = [
  { v: "48", l: "Seleções" },
  { v: "12", l: "Grupos" },
  { v: "104", l: "Partidas" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[color:var(--fifa-night)] text-white">
      {/* Faixa colorida no topo */}
      <div className="absolute inset-x-0 top-0 h-2.5 bg-[repeating-linear-gradient(90deg,#002776_0_60px,#FFDF00_60px_120px,#009739_120px_180px,#FFFFFF_180px_240px)]" />

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr]">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5 font-display text-2xl tracking-wide">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-fifa-gradient text-lg text-white shadow-md">26</span>
              ÁLBUM FIFA 2026
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Colecione, troque e complete seu álbum digital da Copa do Mundo. Acompanhe jogadores, grupos, partidas ao vivo e encontre trocas perto de você.
            </p>

            <div className="mt-6 flex gap-6">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl text-[color:var(--fifa-yellow)]">{s.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Explorar */}
          <div>
            <div className="font-display text-sm tracking-widest text-white/50">EXPLORAR</div>
            <ul className="mt-4 grid grid-cols-2 gap-y-2.5 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/80 transition-colors hover:text-[color:var(--fifa-yellow)]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Copa 2026 */}
          <div>
            <div className="font-display text-sm tracking-widest text-white/50">COPA DO MUNDO 2026</div>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[color:var(--fifa-yellow)]" />
                11 de junho a 19 de julho de 2026
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[color:var(--fifa-yellow)]" />
                Canadá · México · Estados Unidos
              </div>
              <div className="flex items-center gap-3 pt-1 text-2xl">
                <img src="https://flagcdn.com/w40/ca.png" alt="Canadá" className="h-5 w-7 rounded-[2px] object-cover ring-1 ring-white/20" />
                <img src="https://flagcdn.com/w40/mx.png" alt="México" className="h-5 w-7 rounded-[2px] object-cover ring-1 ring-white/20" />
                <img src="https://flagcdn.com/w40/us.png" alt="Estados Unidos" className="h-5 w-7 rounded-[2px] object-cover ring-1 ring-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:px-6">
          <span>© 2026 Álbum FIFA. Projeto independente, não afiliado à FIFA.</span>
          <span className="inline-flex items-center gap-1.5">
            Feito com <Heart className="h-3.5 w-3.5 fill-[color:var(--fifa-green)] text-[color:var(--fifa-green)]" /> pelo futebol brasileiro
          </span>
        </div>
      </div>
    </footer>
  );
}
