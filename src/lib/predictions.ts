import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Prediction = {
  id: string;
  matchId: number;
  uid: string;
  name: string;
  h: number; // gols do mandante
  a: number; // gols do visitante
  createdAt?: { seconds: number } | null;
};

// Um palpite por pessoa por jogo (id = "matchId_uid").
export async function savePrediction(p: { matchId: number; uid: string; name: string; h: number; a: number }): Promise<void> {
  await setDoc(doc(db, "predictions", `${p.matchId}_${p.uid}`), { ...p, createdAt: serverTimestamp() });
}

export function listenPredictions(cb: (list: Prediction[]) => void): () => void {
  return onSnapshot(
    collection(db, "predictions"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Prediction, "id">) }))),
    () => cb([]),
  );
}

// Pontuação de um palpite contra o resultado real: placar exato = 3, acertou o vencedor/empate = 1.
export function scorePrediction(pred: { h: number; a: number }, result: { h: number; a: number }): number {
  if (pred.h === result.h && pred.a === result.a) return 3;
  const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  if (sign(pred.h - pred.a) === sign(result.h - result.a)) return 1;
  return 0;
}
