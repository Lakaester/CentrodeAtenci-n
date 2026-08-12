import { memo } from "react";
import { cn } from "@/lib/utils";
import type { FollowerUI } from "../mappers/follower.mapper";

interface Props { item: FollowerUI }

export const FollowerCard = memo(function FollowerCard({ item }: Props) {
  return (
    <div className="flex gap-3 rounded-lg border border-black-10 bg-white p-3 text-xs transition-colors" role="listitem">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-black-85">{item.user}</span>
          <span className="text-[9px] text-black-25">({item.role})</span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium", item.reasonColor)}>{item.reason}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-black-45">
          <span>Ticket #{item.ticketId}</span>
          <span>{item.sinceLabel}</span>
          {item.notificationsEnabled ? <span className="text-success">Notificaciones activas</span> : <span className="text-black-25">Notificaciones desactivadas</span>}
          {item.status === "inactivo" && <span className="italic text-black-25">Inactivo</span>}
        </div>
      </div>
    </div>
  );
});
