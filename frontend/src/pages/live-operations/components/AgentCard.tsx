import { memo } from "react";
import { cn } from "@/lib/utils";
import type { AgentUI } from "../mappers/agentMapper";

interface Props {
  item: AgentUI;
}

export const AgentCard = memo(function AgentCard({ item }: Props) {
  const cargaPct = Math.min(item.carga, 100);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black-5 text-[11px] font-semibold text-black-45">
        {item.nombre.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-black-85 truncate">{item.nombre}</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.estadoColor)}>
            {item.estadoLabel}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-black-45">
          <span>{item.canal}</span>
          <span>{item.conversacionesActivas} activas</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-black-5">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              cargaPct > 80 ? "bg-danger-50" : cargaPct > 50 ? "bg-warning-50" : "bg-success-50",
            )}
            style={{ width: `${cargaPct}%` }}
          />
        </div>
      </div>
    </div>
  );
});
