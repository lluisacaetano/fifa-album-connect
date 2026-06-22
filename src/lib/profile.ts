import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Uma figurinha para troca: número (ex.: "BRA1") + nome do jogador (para exibir/matchar).
export type TradeSticker = { code: string; name: string };

// Capitais por UF — fallback de coordenadas quando o geocoder falha.
export const CAPITALS: Record<string, [number, number]> = {
  AC: [-9.9747, -67.81], AL: [-9.6498, -35.7089], AP: [0.0349, -51.0694], AM: [-3.119, -60.0217],
  BA: [-12.9777, -38.5016], CE: [-3.7172, -38.5433], DF: [-15.7939, -47.8828], ES: [-20.3155, -40.3128],
  GO: [-16.6869, -49.2648], MA: [-2.5307, -44.3068], MT: [-15.601, -56.0974], MS: [-20.4697, -54.6201],
  MG: [-19.9167, -43.9345], PA: [-1.4558, -48.5039], PB: [-7.1195, -34.845], PR: [-25.4284, -49.2733],
  PE: [-8.0476, -34.877], PI: [-5.0892, -42.8019], RJ: [-22.9068, -43.1729], RN: [-5.7945, -35.211],
  RS: [-30.0346, -51.2177], RO: [-8.7619, -63.9039], RR: [2.8235, -60.6758], SC: [-27.5954, -48.548],
  SP: [-23.5505, -46.6333], SE: [-10.9472, -37.0731], TO: [-10.184, -48.3336],
};

// "Belo Horizonte - MG" -> { name: "Belo Horizonte", uf: "MG" }
export function parseCity(label: string): { name: string; uf: string } {
  const [name, uf] = label.split(" - ");
  return { name: (name || "").trim(), uf: (uf || "").trim().toUpperCase() };
}

// Cidade -> coordenadas. Tenta o Nominatim (OSM); cai para a capital da UF.
export async function geocodeCity(label: string): Promise<{ lat: number; lng: number }> {
  const { name, uf } = parseCity(label);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&city=${encodeURIComponent(name)}&state=${encodeURIComponent(uf)}`;
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    clearTimeout(timer);
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (Array.isArray(data) && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    /* geocoder indisponível — usa a capital */
  }
  const cap = CAPITALS[uf];
  return cap ? { lat: cap[0], lng: cap[1] } : { lat: -15.78, lng: -47.93 }; // centro do Brasil
}

// Salva o álbum (por número) + figurinhas para troca + as que faltam (wants).
export async function saveUserAlbum(uid: string, album: Record<string, number>, trades: TradeSticker[], wants: string[]): Promise<void> {
  try {
    await setDoc(doc(db, "users", uid), { album, trades, wants, updatedAt: Date.now() }, { merge: true });
  } catch {
    /* Firestore pode estar indisponível — ignora */
  }
}

// Distância em km entre dois pontos (Haversine).
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Garante que o usuário tenha coordenadas (preenche quem cadastrou antes do mapa real).
export async function ensureUserLocation(uid: string, cityLabel?: string): Promise<void> {
  if (!cityLabel) return;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.data() as { lat?: number; lng?: number } | undefined;
    if (data && typeof data.lat === "number" && typeof data.lng === "number") return;
    const loc = await geocodeCity(cityLabel);
    await setDoc(doc(db, "users", uid), loc, { merge: true });
  } catch {
    /* ignora */
  }
}
