import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PlayersCarousel } from "@/components/PlayersCarousel";
import { MatchesSection } from "@/components/MatchesSection";
import { ConnectSection } from "@/components/ConnectSection";
import { AlbumSection } from "@/components/AlbumSection";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Álbum FIFA 2026 — Colecione, troque e complete" },
      { name: "description", content: "Rede social para colecionadores do álbum FIFA World Cup 2026: jogadores, partidas e trocas em tempo real." },
      { property: "og:title", content: "Álbum FIFA 2026" },
      { property: "og:description", content: "Colecione, troque e complete seu álbum digital da Copa do Mundo 2026." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <PlayersCarousel />
        <MatchesSection />
        <ConnectSection />
        <AlbumSection />
      </main>
      <Footer />
    </div>
  );
}
