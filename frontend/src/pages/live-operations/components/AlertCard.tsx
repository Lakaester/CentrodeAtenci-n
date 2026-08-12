import { memo } from "react";
import { cn } from "@/lib/utils";
import type { AlertUI } from "../mappers/alertMapper";

interface Props {
  item: AlertUI;
}

export const AlertCard = memo(function AlertCard({ item }: Props) {
  return (
    <div className="flex gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold", item.severityColor)}>
        {item.severidad === "critica" ? "!!" : item.severidad === "alta" ? "!" : "i"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-black-85">{item.titulo}</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.severityColor)}>
            {item.severityLabel}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-black-45">{item.descripcion}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] text-black-25">
          <span>{item.horaLabel}</span>
          <span>{item.estadoLabel}</span>
          <span className="italic">Sugerencia: {item.accionSugerida}</span>
        </div>
      </div>
    </div>
  );
});
