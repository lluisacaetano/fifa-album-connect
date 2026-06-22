import { addDoc, arrayUnion, collection, deleteField, doc, increment, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Figurinha de uma troca: número (ex.: "BRA10") + nome do jogador.
export type TradeItem = { code: string; name: string };
export type TradeStatus = "pending" | "accepted" | "declined";
export type TradeAction = "propose" | "counter" | "accept" | "refuse";
export type DeliveryMethod = "presencial" | "correios" | "transportadora";
export type DeliveryInfo = { method: DeliveryMethod; tracking?: string; carrier?: string };

export type TradeRequest = {
  id: string;
  fromUid: string;
  fromName: string;
  fromCity?: string;
  toUid: string;
  toName: string;
  wanted: TradeItem[]; // o que o REQUISITANTE (fromUid) recebe
  offered: TradeItem[]; // o que o requisitante dá (o outro recebe)
  value?: number; // R$ proposto/acordado da rodada atual (ausente = sem dinheiro)
  valueBy?: string; // quem propôs o valor atual
  message?: string;
  status: TradeStatus;
  participants: string[];
  confirms?: string[]; // uids que já confirmaram a entrega
  delivery?: Record<string, DeliveryInfo>; // entrega informada por cada um
  appliedBy?: string[]; // uids que já deram baixa no álbum
  ratedBy?: string[]; // uids que já avaliaram o outro nesta troca
  // Negociação por rodadas (turn-based) até os DOIS concordarem com a rodada atual.
  agreedBy?: string[]; // uids que aceitaram a rodada atual (itens + valor)
  turn?: string; // uid que deve responder agora (aceitar/recusar/contrapor)
  round?: number; // sobe a cada proposta/contraproposta
  lastActionBy?: string; // quem fez a última ação
  lastAction?: TradeAction;
  createdAt?: { seconds: number } | null;
  updatedAt?: { seconds: number } | null;
};

type SendInput = Omit<TradeRequest, "id" | "status" | "participants" | "createdAt">;

// Itens "limpos" p/ o Firestore (só code/name).
const cleanItems = (items?: TradeItem[]): TradeItem[] => (items ?? []).map((i) => ({ code: i.code, name: i.name }));

// Cria a proposta inicial. O requisitante já "concorda" com a própria proposta;
// a vez (turn) passa pro outro. Campos vazios são omitidos (Firestore rejeita undefined).
export async function sendTradeRequest(data: SendInput): Promise<void> {
  const { message, fromCity, wanted, offered, value, ...rest } = data;
  await addDoc(collection(db, "tradeRequests"), {
    ...rest,
    wanted: cleanItems(wanted),
    offered: cleanItems(offered),
    ...(fromCity ? { fromCity } : {}),
    ...(message ? { message } : {}),
    ...(value ? { value, valueBy: data.fromUid } : {}),
    participants: [data.fromUid, data.toUid],
    status: "pending" as TradeStatus,
    agreedBy: [data.fromUid],
    turn: data.toUid,
    round: 1,
    lastActionBy: data.fromUid,
    lastAction: "propose" as TradeAction,
    createdAt: serverTimestamp(),
  });
}

// Propõe/contrapõe uma rodada: define itens + valor, vira a vez pro outro e ZERA
// o acordo (só o proponente concorda com a própria rodada).
export async function submitProposal(
  id: string,
  data: { wanted: TradeItem[]; offered: TradeItem[]; value?: number; by: string; to: string; action: TradeAction },
): Promise<void> {
  await updateDoc(doc(db, "tradeRequests", id), {
    wanted: cleanItems(data.wanted),
    offered: cleanItems(data.offered),
    value: data.value ? data.value : deleteField(),
    valueBy: data.value ? data.by : deleteField(),
    agreedBy: [data.by],
    turn: data.to,
    round: increment(1),
    lastActionBy: data.by,
    lastAction: data.action,
    updatedAt: serverTimestamp(),
  });
}

// Aceita a rodada atual. Quando os DOIS aceitam, há consenso e abre a entrega.
export async function acceptDeal(id: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "tradeRequests", id), {
    agreedBy: arrayUnion(uid),
    turn: deleteField(),
    lastActionBy: uid,
    lastAction: "accept" as TradeAction,
    updatedAt: serverTimestamp(),
  });
}

// Recusa = cancela a troca.
export async function refuseDeal(id: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "tradeRequests", id), {
    status: "declined" as TradeStatus,
    lastActionBy: uid,
    lastAction: "refuse" as TradeAction,
    updatedAt: serverTimestamp(),
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
