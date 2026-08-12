import { cn } from "@/lib/utils";
import type { ConversationProvider, MensajeGenerico } from "../ConversationTypes";

export class DefaultConversationProvider implements ConversationProvider {
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
          "max-w-[80%] rounded px-3 py-2 text-[13px] leading-relaxed",
          esInterno
            ? "bg-warning-5 border border-amber-200 text-amber-800"
            : msg.autorTipo === "asesor"
              ? "bg-primary text-white"
              : "bg-black-5 text-black-85",
        )}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[11px] font-medium", esInterno ? "text-warning-65" : msg.autorTipo === "asesor" ? "text-white/80" : "text-black-45")}>
              {msg.autor}
            </span>
            <span className={cn("text-[10px]", msg.autorTipo === "asesor" ? "text-white/50" : "text-black-25")}>
              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{msg.contenido}</p>
          <span className={cn("mt-1 inline-block text-[10px]", msg.autorTipo === "asesor" ? "text-white/50" : "text-black-25")}>
            {esInterno ? "🔒 Interno" : msg.canal}
          </span>
        </div>
      </div>
    );
  }
}
