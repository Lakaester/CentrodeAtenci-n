import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ConversationUI } from "../mappers/conversationMapper";

interface Props {
  item: ConversationUI;
}

export const ConversationCard = memo(function ConversationCard({ item }: Props) {
  return (
    <div className="flex gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors" role="listitem">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-black-85">{item.cliente}</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium bg-black-5 text-black-45")}>
            {item.prioridad}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-black-45">
          <span>{item.canal}</span>
          <span>{item.asesor ?? "Sin asignar"}</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.estadoColor)}>
            {item.estadoLabel}
          </span>
          <span>Cola: {item.tiempoColaLabel}</span>
          <span>Atención: {item.tiempoAtencionLabel}</span>
        </div>
        <p className="mt-1 text-[10px] text-black-25 italic truncate">"{item.ultimoMensaje}"</p>
      </div>
    </div>
  );
});
