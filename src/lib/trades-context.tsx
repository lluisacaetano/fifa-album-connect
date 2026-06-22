import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { acceptDeal, confirmDelivery, listenTradeRequests, rateUser, refuseDeal, setRequestStatus, submitProposal, type DeliveryInfo, type TradeItem, type TradeRequest } from "@/lib/trades";
import { chatId, listenMyChats, type ChatSummary } from "@/lib/chat";
import { playPing } from "@/lib/sound";

export type ChatTarget = { uid: string; name: string; photo?: string } | null;

type TradesContextValue = {
  requests: TradeRequest[];
  chatSummaries: ChatSummary[];
  incomingPending: number;
  unread: number;
  markSeen: () => void;
  confirm: (req: TradeRequest, info: DeliveryInfo) => Promise<void>;
  decline: (id: string) => void;
  rate: (req: TradeRequest, stars: number) => void;
  counter: (req: TradeRequest, deal: { wanted: TradeItem[]; offered: TradeItem[]; value?: number }) => Promise<void>;
  accept: (req: TradeRequest) => Promise<void>;
  refuse: (req: TradeRequest) => Promise<void>;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  chatTarget: ChatTarget;
  openChat: (t: ChatTarget) => void;
  closeChat: () => void;
  messagesOpen: boolean;
  openMessages: () => void;
  closeMessages: () => void;
  chatUnread: number;
  chatReads: Record<string, number>;
  chatHidden: Record<string, number>;
  hideChat: (cid: string) => void;
};

const TradesContext = createContext<TradesContextValue | null>(null);
const notifTime = (r: TradeRequest) => r.updatedAt?.seconds ?? r.createdAt?.seconds ?? 0;

export function TradesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TradeRequest[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget>(null);
  const [seen, setSeen] = useState(0);
  const [chatReads, setChatReads] = useState<Record<string, number>>({});
  const [chatHidden, setChatHidden] = useState<Record<string, number>>({});
  const chatPeakRef = useRef(0);
  const chatReadyRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      return;
    }
    try {
      setSeen(Number(localStorage.getItem(`trades-seen-${user.uid}`) || 0));
      setChatReads(JSON.parse(localStorage.getItem(`chat-reads-${user.uid}`) || "{}"));
      setChatHidden(JSON.parse(localStorage.getItem(`chat-hidden-${user.uid}`) || "{}"));
    } catch {
      /* ignora */
    }
    return listenTradeRequests(user.uid, setRequests);
  }, [user]);

  // Marca uma conversa como lida (timestamp), zerando o ponto verde dela.
  // Usa o updatedAt da conversa (+1) p/ não reaparecer por diferença de relógio.
  const markChatRead = (otherUid: string) => {
    if (!user) return;
    const cid = chatId(user.uid, otherUid);
    const summary = chatSummaries.find((c) => c.id === cid);
    const ts = Math.max(Math.floor(Date.now() / 1000), (summary?.updatedAt?.seconds ?? 0) + 1);
    setChatReads((prev) => {
      const next = { ...prev, [cid]: ts };
      try {
        localStorage.setItem(`chat-reads-${user.uid}`, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  };

  // Apaga (oculta pra mim) uma conversa. Some da lista; se chegar mensagem nova
  // depois, ela reaparece (compara com o updatedAt da conversa).
  const hideChat = (cid: string) => {
    if (!user) return;
    const summary = chatSummaries.find((c) => c.id === cid);
    const ts = Math.max(Math.floor(Date.now() / 1000), (summary?.updatedAt?.seconds ?? 0) + 1);
    setChatHidden((prev) => {
      const next = { ...prev, [cid]: ts };
      try {
        localStorage.setItem(`chat-hidden-${user.uid}`, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  };

  // Conversas: toca um som quando chega mensagem nova de outra pessoa.
  useEffect(() => {
    if (!user) {
      setChatSummaries([]);
      chatReadyRef.current = false;
      chatPeakRef.current = 0;
      return;
    }
    return listenMyChats(user.uid, (list) => {
      const peak = list.filter((c) => c.lastFrom !== user.uid).reduce((m, c) => Math.max(m, c.updatedAt?.seconds ?? 0), 0);
      if (chatReadyRef.current && peak > chatPeakRef.current) playPing();
      chatPeakRef.current = Math.max(chatPeakRef.current, peak);
      chatReadyRef.current = true;
      setChatSummaries(list);
    });
  }, [user]);

  // Pendências MINHAS: trocas em aberto onde EU ainda não confirmei a entrega (fica até resolver).
  const incomingPending = useMemo(
    () => requests.filter((r) => r.status === "pending" && r.participants.includes(user?.uid ?? "") && !(r.confirms ?? []).includes(user?.uid ?? "")).length,
    [requests, user],
  );

  // Sino = só trocas (pendências minhas persistem + conclusões/recusas somem ao abrir).
  // Mensagens NÃO entram aqui — têm o ícone próprio de chat.
  const unread = useMemo(() => {
    if (!user) return 0;
    const transient = requests.filter((r) => {
      const t = notifTime(r);
      if (t <= seen) return false;
      return (r.status === "accepted" || r.status === "declined") && r.participants.includes(user.uid);
    }).length;
    return incomingPending + transient;
  }, [requests, user, seen, incomingPending]);

  // Conversas com mensagem nova que ainda não abri (badge do ícone de mensagens).
  const chatUnread = useMemo(
    () => (user ? chatSummaries.filter((c) => c.lastFrom !== user.uid && (c.updatedAt?.seconds ?? 0) > (chatReads[c.id] ?? 0)).length : 0),
    [chatSummaries, user, chatReads],
  );

  const markSeen = () => {
    if (!user) return;
    const now = Math.floor(Date.now() / 1000);
    setSeen(now);
    try {
      localStorage.setItem(`trades-seen-${user.uid}`, String(now));
    } catch {
      /* ignora */
    }
  };

  return (
    <TradesContext.Provider
      value={{
        requests,
        chatSummaries,
        incomingPending,
        unread,
        markSeen,
        confirm: async (req, info) => {
          if (!user) return;
          const other = req.participants.find((p) => p !== user.uid);
          const otherConfirmed = !!other && (req.confirms ?? []).includes(other);
          await confirmDelivery(req.id, user.uid, info, otherConfirmed);
        },
        decline: (id) => setRequestStatus(id, "declined"),
        rate: (req, stars) => {
          if (!user) return;
          const other = req.participants.find((p) => p !== user.uid);
          if (other) rateUser(other, user.uid, stars, req.id);
        },
        counter: async (req, deal) => {
          if (!user) return;
          const other = req.participants.find((p) => p !== user.uid) ?? req.toUid;
          await submitProposal(req.id, { wanted: deal.wanted, offered: deal.offered, value: deal.value, by: user.uid, to: other, action: "counter" });
        },
        accept: async (req) => {
          if (!user) return;
          await acceptDeal(req.id, user.uid);
        },
        refuse: async (req) => {
          if (!user) return;
          await refuseDeal(req.id, user.uid);
        },
        panelOpen,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
        chatTarget,
        openChat: (t) => {
          if (t) markChatRead(t.uid);
          setChatTarget(t);
        },
        closeChat: () => {
          if (chatTarget) markChatRead(chatTarget.uid);
          setChatTarget(null);
        },
        messagesOpen,
        openMessages: () => setMessagesOpen(true),
        closeMessages: () => setMessagesOpen(false),
        chatUnread,
        chatReads,
        chatHidden,
        hideChat,
      }}
    >
      {children}
    </TradesContext.Provider>
  );
}

export function useTrades() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error("useTrades precisa estar dentro de <TradesProvider>");
  return ctx;
}
