import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { listenTradeRequests, setRequestStatus, type TradeRequest } from "@/lib/trades";

export type ChatTarget = { uid: string; name: string; photo?: string } | null;

type TradesContextValue = {
  requests: TradeRequest[];
  incomingPending: number;
  unread: number;
  markSeen: () => void;
  accept: (id: string) => void;
  decline: (id: string) => void;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  chatTarget: ChatTarget;
  openChat: (t: ChatTarget) => void;
  closeChat: () => void;
};

const TradesContext = createContext<TradesContextValue | null>(null);
const notifTime = (r: TradeRequest) => r.updatedAt?.seconds ?? r.createdAt?.seconds ?? 0;

export function TradesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TradeRequest[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget>(null);
  const [seen, setSeen] = useState(0);

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

  const incomingPending = useMemo(() => requests.filter((r) => r.toUid === user?.uid && r.status === "pending").length, [requests, user]);

  // Não lidas: pedidos recebidos pendentes + meus enviados que mudaram de status.
  const unread = useMemo(() => {
    if (!user) return 0;
    return requests.filter((r) => {
      const t = notifTime(r);
      if (t <= seen) return false;
      if (r.toUid === user.uid && r.status === "pending") return true;
      if (r.fromUid === user.uid && r.status !== "pending") return true;
      return false;
    }).length;
  }, [requests, user, seen]);

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
        incomingPending,
        unread,
        markSeen,
        accept: (id) => setRequestStatus(id, "accepted"),
        decline: (id) => setRequestStatus(id, "declined"),
        panelOpen,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
        chatTarget,
        openChat: (t) => setChatTarget(t),
        closeChat: () => setChatTarget(null),
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
