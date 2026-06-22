import { useAuth } from "@/lib/auth";
import { useTrades } from "@/lib/trades-context";
import { TradeRequestsPanel } from "@/components/TradeRequestsPanel";
import { ChatDrawer } from "@/components/ChatDrawer";
import { MessagesInbox } from "@/components/MessagesInbox";

// Painel de pedidos + caixa de mensagens + chat, montados uma vez (abrem de qualquer lugar).
export function TradesOverlays() {
  const { user } = useAuth();
  const { requests, panelOpen, closePanel, confirm, decline, openChat, chatSummaries, messagesOpen, closeMessages } = useTrades();
  if (!user) return null;
  return (
    <>
      <TradeRequestsPanel open={panelOpen} onClose={closePanel} requests={requests} myUid={user.uid} onConfirm={confirm} onDecline={decline} onChat={openChat} />
      <MessagesInbox open={messagesOpen} onClose={closeMessages} summaries={chatSummaries} myUid={user.uid} onOpenChat={openChat} />
      <ChatDrawer />
    </>
  );
}
