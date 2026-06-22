import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TradeAction, TradeItem } from "@/lib/trades";

// Resumo de uma rodada de negociação, virado cartão no chat.
export type TradeCardMeta = { action: TradeAction; wanted: TradeItem[]; offered: TradeItem[]; value?: number; by: string };

export type ChatMessage = {
  id: string;
  from: string;
  fromName: string;
  text: string;
  kind?: "trade"; // mensagem-cartão de negociação
  meta?: TradeCardMeta;
  createdAt?: { seconds: number } | null;
};

export type ChatSummary = {
  id: string;
  participants: string[];
  names?: Record<string, string>; // uid -> nome (dos dois lados)
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

export async function sendMessage(
  cid: string,
  msg: { from: string; fromName: string; to: string; toName: string; text: string; kind?: "trade"; meta?: TradeCardMeta },
): Promise<void> {
  await addDoc(collection(db, "chats", cid, "messages"), {
    from: msg.from,
    fromName: msg.fromName,
    text: msg.text,
    ...(msg.kind ? { kind: msg.kind } : {}),
    ...(msg.meta ? { meta: msg.meta } : {}),
    createdAt: serverTimestamp(),
  });
  // Resumo da conversa (notifica o outro lado e alimenta a caixa de mensagens).
  try {
    await setDoc(
      doc(db, "chats", cid),
      {
        participants: cid.split("_"),
        names: { [msg.from]: msg.fromName, [msg.to]: msg.toName },
        lastText: msg.text,
        lastFrom: msg.from,
        lastFromName: msg.fromName,
        updatedAt: serverTimestamp(),
      },
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
