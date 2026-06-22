import { addDoc, arrayUnion, collection, doc, increment, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Figurinha de uma troca: número (ex.: "BRA10") + nome do jogador.
export type TradeItem = { code: string; name: string };
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
  wanted: TradeItem[]; // figurinhas dele que eu quero (número + nome)
  offered: TradeItem[]; // figurinhas minhas que ele pode querer (número + nome)
  message?: string;
  status: TradeStatus;
  participants: string[];
  confirms?: string[]; // uids que já confirmaram a entrega
  delivery?: Record<string, DeliveryInfo>; // entrega informada por cada um
  appliedBy?: string[]; // uids que já deram baixa no álbum
  ratedBy?: string[]; // uids que já avaliaram o outro nesta troca
  createdAt?: { seconds: number } | null;
  updatedAt?: { seconds: number } | null;
};

type SendInput = Omit<TradeRequest, "id" | "status" | "participants" | "createdAt">;

// Cria um pedido de troca. Oferecer é OPCIONAL (offered pode ser []), e
// campos vazios (message/fromCity) são omitidos — o Firestore rejeita undefined.
export async function sendTradeRequest(data: SendInput): Promise<void> {
  const { message, fromCity, wanted, offered, ...rest } = data;
  await addDoc(collection(db, "tradeRequests"), {
    ...rest,
    wanted: wanted ?? [],
    offered: offered ?? [],
    ...(fromCity ? { fromCity } : {}),
    ...(message ? { message } : {}),
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

// Avalia o outro colecionador (1–5 estrelas) numa troca concluída. Uma vez por troca.
export async function rateUser(ratedUid: string, raterUid: string, stars: number, tradeId: string): Promise<void> {
  await updateDoc(doc(db, "users", ratedUid), { ratingSum: increment(stars), ratingCount: increment(1) });
  await updateDoc(doc(db, "tradeRequests", tradeId), { ratedBy: arrayUnion(raterUid) });
}
