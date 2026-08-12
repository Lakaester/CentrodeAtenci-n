import { memo } from "react";
import { cn } from "@/lib/utils";
import type { QueueItemUI } from "../mappers/queueMapper";

interface Props {
  item: QueueItemUI;
}

export const QueueCard = memo(function QueueCard({ item }: Props) {
  const prioridadLabel = item.prioridad.charAt(0).toUpperCase() + item.prioridad.slice(1);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors" role="listitem">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-black-85 truncate">{item.cliente}</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.prioridadColor)}>
            {prioridadLabel}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-black-45">
          <span>{item.canal}</span>
          <span>{item.tiempoLabel}</span>
          <span>{item.estado}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {item.slaCritico ? (
          <span className="font-semibold text-danger text-[10px]">
            SLA {item.slaMin} min
          </span>
        ) : (
          <span className="text-black-25 text-[10px]">
            SLA {item.slaMin} min
          </span>
        )}
        {item.asignado ? (
          <span className="text-black-25 text-[9px]">{item.asignado}</span>
        ) : (
          <span className="text-warning text-[9px]">Sin asignar</span>
        )}
      </div>
    </div>
  );
});
