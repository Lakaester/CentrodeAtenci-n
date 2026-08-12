import { memo } from "react";
import { cn } from "@/lib/utils";
import type { TimelineUI } from "../mappers/timeline.mapper";

interface Props { item: TimelineUI }

export const TimelineCard = memo(function TimelineCard({ item }: Props) {
  return (
    <div className="flex gap-4 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors" role="listitem">
      <div className="flex flex-col items-center">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", item.typeColor)}>
          <span className="text-[11px] font-bold">{item.iconKey === "alertTriangle" ? "!" : item.iconKey === "atSign" ? "@" : item.iconKey === "checkCircle" ? "✓" : item.iconKey === "userPlus" ? "+" : item.iconKey === "userMinus" ? "−" : "•"}</span>
        </div>
        <div className="mt-1 h-full w-px bg-black-10" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.typeColor)}>{item.typeLabel}</span>
          <span className="text-[9px] text-black-25">{item.timeAgo}</span>
          <span className="text-[9px] text-black-25 italic">{item.sourceLabel}</span>
        </div>
        <p className="mt-1 font-medium text-black-85">{item.title}</p>
        <p className="text-[10px] text-black-45">{item.description}</p>
        <p className="mt-0.5 text-[9px] text-black-25">— {item.actor} ({item.actorRole}) · {item.entityType} #{item.entityId}</p>
      </div>
    </div>
  );
});
