import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ChatMessage = {
  id: string;
  from: string;
  fromName: string;
  text: string;
  createdAt?: { seconds: number } | null;
};

export type ChatSummary = {
  id: string;
  participants: string[];
  lastText: string;
  lastFrom: string;
  lastFromName: string;
  updatedAt?: { seconds: number } | null;
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
  // Resumo da conversa (para notificar o outro lado de novas mensagens).
  try {
    await setDoc(
      doc(db, "chats", cid),
      { participants: cid.split("_"), lastText: msg.text, lastFrom: msg.from, lastFromName: msg.fromName, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    /* ignora */
  }
}

// Conversas em que o usuário participa (para o sino + som de novas mensagens).
export function listenMyChats(uid: string, cb: (list: ChatSummary[]) => void): () => void {
  const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatSummary, "id">) }))),
    () => cb([]),
  );
}
