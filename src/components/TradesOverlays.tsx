import { useAuth } from "@/lib/auth";
import { useTrades } from "@/lib/trades-context";
import { TradeRequestsPanel } from "@/components/TradeRequestsPanel";
import { ChatDrawer } from "@/components/ChatDrawer";

// Painel de pedidos + chat, montados uma vez para serem abertos de qualquer lugar.
export function TradesOverlays() {
  const { user } = useAuth();
  const { requests, panelOpen, closePanel, confirm, decline, openChat } = useTrades();
  if (!user) return null;
  return (
    <>
      <TradeRequestsPanel open={panelOpen} onClose={closePanel} requests={requests} myUid={user.uid} onConfirm={confirm} onDecline={decline} onChat={openChat} />
      <ChatDrawer />
    </>
  );
}
