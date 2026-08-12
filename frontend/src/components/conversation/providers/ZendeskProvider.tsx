import { cn } from "@/lib/utils";
import type { ConversationProvider, MensajeGenerico } from "../ConversationTypes";

export class ZendeskConversationProvider implements ConversationProvider {
  readonly canal = "zendesk" as const;

  renderizar(msg: MensajeGenerico, _esUltimo: boolean): React.ReactNode {
    if (msg.tipo === "evento" || msg.tipo === "sistema") {
      return (
        <div className="flex items-center gap-2 py-1 text-[10px] text-black-25 italic">
          <span>{msg.contenido}</span>
          <span className="ml-auto">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
        </div>
      );
    }

    const esInterno = msg.esInterno ?? false;
    return (
      <div className={cn("flex gap-2.5", esInterno ? "flex-row-reverse" : "")}>
        <div className={cn(
          "max-w-[82%] rounded-lg px-2.5 py-1.5 text-[12px] leading-relaxed",
          esInterno
            ? "bg-warning-5 border border-amber-200 text-amber-800 rounded-br-sm"
            : msg.autorTipo === "asesor"
              ? "bg-primary text-white rounded-br-sm"
              : "bg-black-5 text-black-85 rounded-bl-sm",
        )}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[10px] font-medium", esInterno ? "text-warning-65" : msg.autorTipo === "asesor" ? "text-white/80" : "text-black-45")}>
              {msg.autor}
            </span>
            <span className={cn("text-[9px]", esInterno ? "text-amber-400" : msg.autorTipo === "asesor" ? "text-white/50" : "text-black-25")}>
              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{msg.contenido}</p>
          {msg.adjuntos && msg.adjuntos.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {msg.adjuntos.map((a) => (
                <span key={a.id} className={cn("text-[9px] underline", esInterno ? "text-warning" : msg.autorTipo === "asesor" ? "text-white/70" : "text-primary")}>
                  📎 {a.nombre}
                </span>
              ))}
            </div>
          )}
          <span className={cn("mt-0.5 inline-block text-[9px]", esInterno ? "text-amber-400" : msg.autorTipo === "asesor" ? "text-white/50" : "text-black-25")}>
            {esInterno ? "🔒 Nota interna" : msg.autorTipo === "asesor" ? "Asesor" : "Cliente"}
          </span>
        </div>
      </div>
    );
  }
}
