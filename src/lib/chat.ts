import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ChatMessage = {
  id: string;
  from: string;
  fromName: string;
  text: string;
  createdAt?: { seconds: number } | null;
};

// Id da conversa = os dois uids ordenados (mesma sala para os dois lados).
export function chatId(a: string, b: string): string {
  return [a, b].sort().join("_");
}

export function listenMessages(cid: string, cb: (msgs: ChatMessage[]) => void): () => void {
  const q = query(collection(db, "chats", cid, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))),
    () => cb([]),
  );
}

export async function sendMessage(cid: string, msg: { from: string; fromName: string; text: string }): Promise<void> {
  await addDoc(collection(db, "chats", cid, "messages"), { ...msg, createdAt: serverTimestamp() });
}
