import { memo } from "react";
import { cn } from "@/lib/utils";
import type { MentionUI } from "../mappers/mention.mapper";

interface Props { item: MentionUI }

export const MentionCard = memo(function MentionCard({ item }: Props) {
  return (
    <div className={cn("flex gap-3 rounded-lg border p-3 text-xs transition-colors", item.isRead ? "border-black-10 bg-white" : "border-[#2563EB]/30 bg-primary-5/30")} role="listitem">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {!item.isRead && <span className="h-2 w-2 rounded-full bg-primary" aria-label="No leído" />}
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.statusColor)}>{item.status}</span>
          <span className="text-[9px] text-black-25">{item.timeAgo}</span>
        </div>
        <p className="mt-1 text-[10px] text-black-85">
          <span className="font-medium">{item.mentionedBy}</span>
          <span className="text-black-45"> mencionó a </span>
          <span className="font-medium">{item.mentionedUser}</span>
          <span className="text-black-45"> ({item.mentionedRole})</span>
        </p>
        <p className="mt-0.5 text-[10px] text-black-45 italic">"{item.message}"</p>
        <p className="mt-0.5 text-[9px] text-black-25">Ticket #{item.ticketId}</p>
      </div>
    </div>
  );
});
