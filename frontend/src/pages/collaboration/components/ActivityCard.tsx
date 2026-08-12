import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ActivityUI } from "../mappers/activity.mapper";

interface Props {
  item: ActivityUI;
}

export const ActivityCard = memo(function ActivityCard({ item }: Props) {
  return (
    <div className="flex gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors" role="listitem">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold", item.typeColor)}>
        {item.iconKey === "alertTriangle" ? "!" : item.iconKey === "atSign" ? "@" : item.iconKey === "checkCircle" ? "✓" : "•"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.typeColor)}>
            {item.typeLabel}
          </span>
          <span className="text-[9px] text-black-25">{item.timeAgo}</span>
        </div>
        <p className="mt-0.5 font-medium text-black-85">{item.title}</p>
        <p className="text-[10px] text-black-45">{item.description}</p>
        <p className="mt-0.5 text-[9px] text-black-25">— {item.user}</p>
      </div>
    </div>
  );
});
