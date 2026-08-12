import type { ZendeskMensajeFE } from "./useZendesk";
import { cn } from "@/lib/utils";

interface CanalRendererProps {
  canal: string;
  mensajes: ZendeskMensajeFE[];
  ticketId?: string;
}

export function ConversationRenderer({ canal, mensajes, ticketId }: CanalRendererProps) {
  switch (canal) {
    case "zendesk":
      return <ZendeskRenderer mensajes={mensajes} ticketId={ticketId} />;
    default:
      return <PlaceholderRenderer canal={canal} />;
  }
}

function ZendeskRenderer({ mensajes }: { mensajes: ZendeskMensajeFE[]; ticketId?: string }) {
  if (mensajes.length === 0) {
    return <div className="flex h-full items-center justify-center text-[11px] text-black-25">Sin mensajes</div>;
  }
  return (
    <div className="space-y-2.5">
      {mensajes.map((msg) => (
        <ChatBubble key={msg.id} msg={msg} />
      ))}
    </div>
  );
}

function ChatBubble({ msg }: { msg: ZendeskMensajeFE }) {
  const esInterna = msg.tipo === "agente";
  return (
    <div className={cn("flex gap-2.5", esInterna ? "flex-row-reverse" : "")}>
      <div className={cn(
        "max-w-[78%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
        esInterna ? "bg-primary text-white rounded-br-sm" : "bg-black-5 text-black-85 rounded-bl-sm",
      )}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-[11px] font-medium", esInterna ? "text-white/80" : "text-black-45")}>{msg.emisor}</span>
          <span className={cn("text-[10px]", esInterna ? "text-white/50" : "text-black-25")}>
            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{msg.contenido}</p>
        <span className={cn("mt-1 inline-block text-[10px]", esInterna ? "text-white/50" : "text-black-25")}>
          {esInterna ? "Nota interna" : "Respuesta pública"}
        </span>
      </div>
    </div>
  );
}

function PlaceholderRenderer({ canal }: { canal: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-[13px] font-medium text-black-25">Canal {canal}</p>
      <p className="text-[11px] text-black-10">
        Disponible cuando la integración con {canal} esté habilitada.
      </p>
    </div>
  );
}
