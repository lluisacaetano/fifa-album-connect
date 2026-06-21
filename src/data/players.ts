// Fonte única dos jogadores da seleção (usada no álbum, no carrossel, etc.).
// As fotos ficam em /public/players/<id>.png (baixadas da TheSportsDB).
// Quem não tem foto (ex.: André) cai num card estilizado pela inicial.

export type Player = {
  id: number;
  number: number;
  name: string;
  position: "Goleiro" | "Defesa" | "Meio" | "Ataque";
  photo: string | null; // caminho da foto recortada, ou null se não houver
};

export const players: Player[] = [
  { id: 1, number: 1, name: "Alisson", position: "Goleiro", photo: "/players/1.png" },
  { id: 2, number: 12, name: "Bento", position: "Goleiro", photo: "/players/2.png" },
  { id: 3, number: 3, name: "Marquinhos", position: "Defesa", photo: "/players/3.png" },
  { id: 4, number: 4, name: "Éder Militão", position: "Defesa", photo: "/players/4.png" },
  { id: 5, number: 5, name: "Gabriel Magalhães", position: "Defesa", photo: "/players/5.png" },
  { id: 6, number: 2, name: "Danilo", position: "Defesa", photo: "/players/6.png" },
  { id: 7, number: 6, name: "Guilherme Arana", position: "Defesa", photo: "/players/7.png" },
  { id: 8, number: 8, name: "Bruno Guimarães", position: "Meio", photo: "/players/8.png" },
  { id: 9, number: 15, name: "André", position: "Meio", photo: null },
  { id: 10, number: 10, name: "Lucas Paquetá", position: "Meio", photo: "/players/10.png" },
  { id: 11, number: 7, name: "Gerson", position: "Meio", photo: "/players/11.png" },
  { id: 12, number: 11, name: "Vinícius Júnior", position: "Ataque", photo: "/players/12.png" },
  { id: 13, number: 19, name: "Rodrygo", position: "Ataque", photo: "/players/13.png" },
  { id: 14, number: 18, name: "Raphinha", position: "Ataque", photo: "/players/14.png" },
  { id: 15, number: 17, name: "Savinho", position: "Ataque", photo: "/players/15.png" },
  { id: 16, number: 16, name: "Estêvão", position: "Ataque", photo: "/players/16.png" },
  { id: 17, number: 9, name: "Endrick", position: "Ataque", photo: "/players/17.png" },
  { id: 18, number: 20, name: "Igor Jesus", position: "Ataque", photo: "/players/18.png" },
];

// Iniciais para o fallback (quando não há foto).
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
