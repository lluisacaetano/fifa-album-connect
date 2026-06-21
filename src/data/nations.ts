// Seleções da Copa 2026 para a seção "Seleções" (carrossel que corre pro lado).
// code = código usado pelo flagcdn.com (ISO alpha-2, ou subdivisão como "gb-eng").
// colors = [cor principal, cor secundária] da bandeira, para tingir o pacote.
// A bandeira vem de: https://flagcdn.com/w320/<code>.png

export type Nation = {
  name: string;
  code: string;
  colors: [string, string];
};

export const nations: Nation[] = [
  // Anfitriões
  { name: "Canadá", code: "ca", colors: ["#FF0000", "#ffffff"] },
  { name: "México", code: "mx", colors: ["#006847", "#CE1126"] },
  { name: "Estados Unidos", code: "us", colors: ["#3C3B6E", "#B22234"] },
  // América do Sul
  { name: "Brasil", code: "br", colors: ["#009739", "#FFDF00"] },
  { name: "Argentina", code: "ar", colors: ["#6CACE4", "#ffffff"] },
  { name: "Uruguai", code: "uy", colors: ["#7CB9E8", "#FCD116"] },
  { name: "Colômbia", code: "co", colors: ["#FCD116", "#003893"] },
  { name: "Equador", code: "ec", colors: ["#FFDD00", "#034EA2"] },
  { name: "Paraguai", code: "py", colors: ["#D52B1E", "#0038A8"] },
  // Europa
  { name: "França", code: "fr", colors: ["#0055A4", "#EF4135"] },
  { name: "Espanha", code: "es", colors: ["#AA151B", "#F1BF00"] },
  { name: "Inglaterra", code: "gb-eng", colors: ["#CF142B", "#ffffff"] },
  { name: "Portugal", code: "pt", colors: ["#006600", "#FF0000"] },
  { name: "Países Baixos", code: "nl", colors: ["#21468B", "#FF4F00"] },
  { name: "Alemanha", code: "de", colors: ["#000000", "#FFCE00"] },
  { name: "Itália", code: "it", colors: ["#008C45", "#CD212A"] },
  { name: "Bélgica", code: "be", colors: ["#000000", "#FDDA24"] },
  { name: "Croácia", code: "hr", colors: ["#FF0000", "#171796"] },
  { name: "Suíça", code: "ch", colors: ["#FF0000", "#ffffff"] },
  { name: "Dinamarca", code: "dk", colors: ["#C8102E", "#ffffff"] },
  { name: "Polônia", code: "pl", colors: ["#DC143C", "#ffffff"] },
  { name: "Sérvia", code: "rs", colors: ["#C6363C", "#0C4076"] },
  { name: "Áustria", code: "at", colors: ["#ED2939", "#ffffff"] },
  { name: "Noruega", code: "no", colors: ["#BA0C2F", "#00205B"] },
  { name: "Escócia", code: "gb-sct", colors: ["#005EB8", "#ffffff"] },
  { name: "Turquia", code: "tr", colors: ["#E30A17", "#ffffff"] },
  // África
  { name: "Marrocos", code: "ma", colors: ["#C1272D", "#006233"] },
  { name: "Senegal", code: "sn", colors: ["#00853F", "#FDEF42"] },
  { name: "Nigéria", code: "ng", colors: ["#008751", "#ffffff"] },
  { name: "Egito", code: "eg", colors: ["#CE1126", "#000000"] },
  { name: "Gana", code: "gh", colors: ["#006B3F", "#FCD116"] },
  { name: "Camarões", code: "cm", colors: ["#007A5E", "#CE1126"] },
  { name: "Costa do Marfim", code: "ci", colors: ["#FF8200", "#009E60"] },
  { name: "Argélia", code: "dz", colors: ["#006233", "#ffffff"] },
  { name: "Tunísia", code: "tn", colors: ["#E70013", "#ffffff"] },
  { name: "África do Sul", code: "za", colors: ["#007A4D", "#FFB915"] },
  // Ásia / Oceania
  { name: "Japão", code: "jp", colors: ["#BC002D", "#ffffff"] },
  { name: "Coreia do Sul", code: "kr", colors: ["#003478", "#C60C30"] },
  { name: "Arábia Saudita", code: "sa", colors: ["#006C35", "#ffffff"] },
  { name: "Irã", code: "ir", colors: ["#239F40", "#DA0000"] },
  { name: "Austrália", code: "au", colors: ["#00008B", "#FFD700"] },
  { name: "Catar", code: "qa", colors: ["#8A1538", "#ffffff"] },
  { name: "Uzbequistão", code: "uz", colors: ["#0099B5", "#1EB53A"] },
  { name: "Jordânia", code: "jo", colors: ["#007A3D", "#CE1126"] },
  // CONCACAF
  { name: "Costa Rica", code: "cr", colors: ["#002B7F", "#CE1126"] },
  { name: "Jamaica", code: "jm", colors: ["#009B3A", "#FED100"] },
  { name: "Panamá", code: "pa", colors: ["#005293", "#D21034"] },
  { name: "Honduras", code: "hn", colors: ["#0073CF", "#ffffff"] },
];
