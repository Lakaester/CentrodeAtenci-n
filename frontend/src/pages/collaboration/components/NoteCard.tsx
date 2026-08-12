import { memo } from "react";
import { cn } from "@/lib/utils";
import type { NoteUI } from "../mappers/note.mapper";

interface Props {
  item: NoteUI;
}

export const NoteCard = memo(function NoteCard({ item }: Props) {
  return (
    <div className={cn("flex gap-3 rounded-lg border p-3 text-xs transition-colors", item.isPinned ? "border-[#2563EB]/30 bg-primary-5/30" : "border-black-10 bg-white")} role="listitem">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {item.isPinned && <span className="text-[10px] text-primary">📌</span>}
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.categoryColor)}>
            {item.category}
          </span>
          <span className="text-[9px] text-black-25">{item.timeAgo}</span>
          {item.visibility !== "team" && (
            <span className="text-[9px] text-warning italic">{item.visibility === "supervisor" ? "Solo supervisores" : "Privada"}</span>
          )}
        </div>
        <p className="mt-1 text-[10px] text-black-85 leading-relaxed whitespace-pre-line">{item.content}</p>
        <div className="mt-1 flex items-center gap-2 text-[9px] text-black-25">
          <span className="font-medium text-black-45">{item.author}</span>
          <span>{item.authorRole}</span>
          <span>Ticket #{item.ticketId}</span>
          {item.status === "archivada" && <span className="italic">Archivada</span>}
        </div>
      </div>
    </div>
  );
});
