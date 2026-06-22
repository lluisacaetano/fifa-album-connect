import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { confirmDelivery, listenTradeRequests, setRequestStatus, type DeliveryInfo, type TradeRequest } from "@/lib/trades";
import { listenMyChats, type ChatSummary } from "@/lib/chat";
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
  const chatPeakRef = useRef(0);
  const chatReadyRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      return;
    }
    try {
      setSeen(Number(localStorage.getItem(`trades-seen-${user.uid}`) || 0));
    } catch {
      /* ignora */
    }
    return listenTradeRequests(user.uid, setRequests);
  }, [user]);

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

  // Não lidas = pendências minhas (persistem) + conclusões/recusas e mensagens novas (somem ao abrir).
  const unread = useMemo(() => {
    if (!user) return 0;
    const transient = requests.filter((r) => {
      const t = notifTime(r);
      if (t <= seen) return false;
      return (r.status === "accepted" || r.status === "declined") && r.participants.includes(user.uid);
    }).length;
    const chats = chatSummaries.filter((c) => c.lastFrom !== user.uid && (c.updatedAt?.seconds ?? 0) > seen).length;
    return incomingPending + transient + chats;
  }, [requests, chatSummaries, user, seen, incomingPending]);

  // Conversas com mensagem nova (para o badge do ícone de mensagens no menu).
  const chatUnread = useMemo(
    () => (user ? chatSummaries.filter((c) => c.lastFrom !== user.uid && (c.updatedAt?.seconds ?? 0) > seen).length : 0),
    [chatSummaries, user, seen],
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
        panelOpen,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
        chatTarget,
        openChat: (t) => setChatTarget(t),
        closeChat: () => setChatTarget(null),
        messagesOpen,
        openMessages: () => {
          markSeen();
          setMessagesOpen(true);
        },
        closeMessages: () => setMessagesOpen(false),
        chatUnread,
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
