export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-foreground text-background">
      <div className="absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(90deg,#002776_0_60px,#FFDF00_60px_120px,#009739_120px_180px,#FFFFFF_180px_240px)]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-2xl">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-fifa-gradient text-white">26</span>
            ÁLBUM FIFA 2026
          </div>
          <p className="mt-3 text-sm opacity-70">Colecione, troque e complete seu álbum digital da Copa do Mundo.</p>
        </div>
        <div>
          <div className="font-display text-sm tracking-widest opacity-60">PRODUTO</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#jogadores" className="hover:opacity-80">Jogadores</a></li>
            <li><a href="#partidas" className="hover:opacity-80">Partidas</a></li>
            <li><a href="#conectar" className="hover:opacity-80">Trocas</a></li>
            <li><a href="#album" className="hover:opacity-80">Meu Álbum</a></li>
          </ul>
        </div>
        <div>
          <div className="font-display text-sm tracking-widest opacity-60">LEGAL</div>
          <p className="mt-3 text-xs opacity-60">*Este é um projeto independente e não é afiliado à FIFA.</p>
        </div>
      </div>
      <div className="border-t border-background/10 py-4 text-center text-xs opacity-50">
        © 2026 Álbum FIFA. Feito com paixão pelo futebol.
      </div>
    </footer>
  );
}
