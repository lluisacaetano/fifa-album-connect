import { addDoc, arrayUnion, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TradeStatus = "pending" | "accepted" | "declined";
export type DeliveryMethod = "presencial" | "correios" | "transportadora";
export type DeliveryInfo = { method: DeliveryMethod; tracking?: string; carrier?: string };

export type TradeRequest = {
  id: string;
  fromUid: string;
  fromName: string;
  fromCity?: string;
  toUid: string;
  toName: string;
  wanted: string[]; // figurinhas dele que eu quero
  offered: string[]; // figurinhas minhas que ele pode querer
  message?: string;
  status: TradeStatus;
  participants: string[];
  confirms?: string[]; // uids que já confirmaram a entrega
  delivery?: Record<string, DeliveryInfo>; // entrega informada por cada um
  appliedBy?: string[]; // uids que já deram baixa no álbum
  createdAt?: { seconds: number } | null;
  updatedAt?: { seconds: number } | null;
};

type SendInput = Omit<TradeRequest, "id" | "status" | "participants" | "createdAt">;

// Cria um pedido de troca.
export async function sendTradeRequest(data: SendInput): Promise<void> {
  await addDoc(collection(db, "tradeRequests"), {
    ...data,
    participants: [data.fromUid, data.toUid],
    status: "pending" as TradeStatus,
    createdAt: serverTimestamp(),
  });
}

// Escuta, em tempo real, todos os pedidos em que o usuário participa (enviados + recebidos).
export function listenTradeRequests(uid: string, cb: (list: TradeRequest[]) => void): () => void {
  const q = query(collection(db, "tradeRequests"), where("participants", "array-contains", uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TradeRequest, "id">) }));
      // mais recentes primeiro (ordenado no cliente p/ não exigir índice composto)
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      cb(list);
    },
    () => cb([]),
  );
}

export async function setRequestStatus(id: string, status: TradeStatus): Promise<void> {
  await updateDoc(doc(db, "tradeRequests", id), { status, updatedAt: serverTimestamp() });
}

// Confirma a entrega do usuário. Quando os DOIS confirmam, a troca vira "accepted".
// `otherConfirmed` = o outro participante já tinha confirmado antes desta chamada.
export async function confirmDelivery(id: string, uid: string, info: DeliveryInfo, otherConfirmed: boolean): Promise<void> {
  const patch: Record<string, unknown> = {
    confirms: arrayUnion(uid),
    [`delivery.${uid}`]: info,
    updatedAt: serverTimestamp(),
  };
  if (otherConfirmed) patch.status = "accepted"; // os dois confirmaram
  await updateDoc(doc(db, "tradeRequests", id), patch);
}

// Marca que o usuário já deu baixa no álbum por causa desta troca (idempotente entre aparelhos).
export async function markTradeApplied(id: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "tradeRequests", id), { appliedBy: arrayUnion(uid) });
}
