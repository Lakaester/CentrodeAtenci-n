import { memo } from "react";
import { cn } from "@/lib/utils";
import type { AgentOverviewUI } from "../mappers/agentOverviewMapper";

interface Props {
  item: AgentOverviewUI;
}

export const AgentOverviewCard = memo(function AgentOverviewCard({ item }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors" role="listitem">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black-5 text-[12px] font-semibold text-black-45">
        {item.nombre.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-black-85 truncate">{item.nombre}</span>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium", item.estadoColor)}>
            {item.estadoLabel}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-black-45">
          <span>{item.canalPrincipal}</span>
          <span>{item.conversacionesActivas} activas</span>
          <span>SLA {item.slaLabel}</span>
          <span>{item.ultimaActividadLabel}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-black-5">
          <div
            className={cn("h-1.5 rounded-full transition-all", item.ocupacionBarColor)}
            style={{ width: `${Math.min(item.ocupacionPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});
