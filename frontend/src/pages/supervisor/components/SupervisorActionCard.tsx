import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ResolvedAction } from "../hooks/useSupervisorActions";

interface Props {
  item: ResolvedAction;
}

export const SupervisorActionCard = memo(function SupervisorActionCard({ item }: Props) {
  const Icon = item.Icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-xs transition-colors",
        item.habilitada
          ? "border-black-10 bg-white cursor-pointer"
          : "border-dashed border-black-10 bg-white/50 cursor-not-allowed opacity-60",
      )}
      role="listitem"
      aria-disabled={!item.habilitada}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", item.categoryColor)}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-black-85">{item.nombre}</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.categoryColor)}>
            {item.categoryLabel}
          </span>
          {!item.habilitada && (
            <span className="text-[9px] text-black-25">Próximamente</span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] text-black-45">{item.descripcion}</p>
      </div>
    </div>
  );
});
