import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useInbox, inboxToCompactItem } from "@/modules/inbox";
import type { InboxTicketDTO } from "@/modules/inbox/dto/inbox.dto";
import { useConversation, conversationToTicketComentario } from "@/modules/conversation";
import { useCustomerContext } from "@/modules/customer-context";
import { initApiMiddleware, setInboxTickets } from "@/lib/apiMiddleware";
import { ZendeskInboxSkeleton } from "@/components/zendesk/ZendeskInboxSkeleton";
import { CompactInbox } from "@/components/workspace/CompactInbox";
import { WorkspaceArea } from "@/components/workspace/WorkspaceArea";
import { PanelOperativo } from "@/components/workspace/PanelOperativo";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import type { TicketComentario } from "@/hooks/useTicketDetail";

export default function Atenciones() {
  const [activa, setActiva] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const ticketParam = searchParams.get("ticket");
  const canalParam = searchParams.get("canal");
  const esDeepLinkZendesk = Boolean(ticketParam && (canalParam === "CORREO" || canalParam === "ZENDESK"));
  const [retryKey, setRetryKey] = useState(0);

  // Deep link de COSE: solo para atenciones de Zendesk/CORREO.
  // Los IDs de WhatsApp pueden coincidir con IDs de Zendesk, por eso se exige canal.
  useEffect(() => {
    if (!ticketParam) return;
    if (canalParam === "CORREO" || canalParam === "ZENDESK") {
      setActiva(ticketParam);
    } else {
      // Evita abrir por accidente un ID de WhatsApp contra el detalle de Zendesk.
      setActiva(null);
    }
  }, [ticketParam, canalParam]);
  const [panelOpen, setPanelOpen] = useState(true);
  const { tickets: inboxTickets, count, isLoading, isError, error, refetch } = useInbox();
  const ticketDetail = useTicketDetail(activa, retryKey);

  const activeTicket = useMemo<InboxTicketDTO | null>(
    () => inboxTickets.find((t) => t.ticketNumber === activa) ?? null,
    [inboxTickets, activa],
  );

  const conversation = useConversation(activeTicket);
  const customerCtx = useCustomerContext(activeTicket);

  useEffect(() => { initApiMiddleware(); setInboxTickets(inboxTickets); }, [inboxTickets]);

  const tickets = useMemo(() => inboxTickets.map(inboxToCompactItem), [inboxTickets]);

  const comentarios = useMemo<TicketComentario[]>(
    () => conversation.messages.map(conversationToTicketComentario),
    [conversation.messages],
  );

  const ticketDetailWithConv = useMemo(
    () => ({
      ...ticketDetail,
      comentarios: comentarios.length > 0 ? comentarios : ticketDetail.comentarios,
      loading: ticketDetail.loading || conversation.isLoading,
    }),
    [ticketDetail, comentarios, conversation.isLoading],
  );

  const handleRefresh = useCallback(() => {
    setRetryKey((k) => k + 1);
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex flex-1 h-full bg-white">
        <div className="w-72 shrink-0 border-r border-black-10 bg-white flex flex-col min-h-0">
          <div className="border-b border-black-10 px-3 py-2 shrink-0">
            <h2 className="text-xs font-semibold text-black-85">Bandeja</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ZendeskInboxSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 h-full items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-sm font-medium text-danger">Error al cargar tickets</p>
          <p className="mt-1 text-xs text-danger-65">{error}</p>
          <button onClick={() => refetch()} className="mt-3 rounded bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-85">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Columna Izquierda: Bandeja */}
      <div className="w-72 shrink-0 border-r border-black-10 bg-white flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-black-10 px-3 py-2 shrink-0">
          <h2 className="text-xs font-semibold text-black-85">Bandeja</h2>
          <span className="text-[9px] text-black-45">{count}</span>
        </div>
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <CompactInbox tickets={tickets} activa={activa} onSelect={(id) => setActiva(id === activa ? null : id)} />
        </div>
      </div>

      {/* Columna Central: Workspace */}
      <div className="flex flex-1 flex-col min-w-0 bg-white border-r border-black-10">
        {activa && !ticketDetail.loading && (ticketDetail.error || (esDeepLinkZendesk && !ticketDetail.ticket)) ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-md text-center">
              <p className="text-sm font-medium text-danger">No se pudo cargar la atención #{activa}</p>
              <p className="mt-1 text-xs text-danger-65">
                {esDeepLinkZendesk && (!ticketDetail.error || /status code (404|500)/i.test(ticketDetail.error))
                  ? "El ticket no existe o no está disponible en la bandeja."
                  : ticketDetail.error}
              </p>
            </div>
          </div>
        ) : (
          <WorkspaceArea ticketId={activa} ticketDetail={ticketDetailWithConv} onRefresh={handleRefresh} />
        )}
      </div>

      {/* Columna Derecha: Panel Operativo (permanente, abatible 48px / expandido 420-520px) */}
      <div
        className="shrink-0 bg-white flex flex-col min-h-0 border-l border-black-10 transition-[width] duration-250 ease-out"
        style={{ width: panelOpen ? "clamp(420px, 32vw, 520px)" : "48px" }}
      >
        <PanelOperativo
          customer={ticketDetail.customer}
          ticket={ticketDetail.ticket}
          clienteCope={ticketDetail.clienteCope}
          operativa={ticketDetail.operativa}
          onOpenTicket={(id) => setActiva(id)}
          onRefreshOperativa={handleRefresh}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((v) => !v)}
        />
        {customerCtx.context && void 0}
      </div>
    </div>
  );
}
