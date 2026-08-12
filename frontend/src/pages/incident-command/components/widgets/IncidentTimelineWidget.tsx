import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { TimelineUI } from "../../mappers/incident.mapper";

interface Props { items: TimelineUI[]; state: "loading" | "empty" | "error" | "success" }

export function IncidentTimelineWidget({ items, state }: Props) {
  const recent = useMemo(() => [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5), [items]);
  if (state !== "success") return <DashboardWidget title="Incident Timeline" subtitle="Latest events" state={state} />;
  return (
    <DashboardWidget title="Incident Timeline" subtitle="Latest events" state="success">
      <div className="flex gap-3 mb-3 text-[10px]"><span className="font-medium text-black-85">{items.length} events</span></div>
      <div className="space-y-1 text-[10px]">{recent.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className="text-[9px] text-black-25 w-12 shrink-0">{new Date(e.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="font-medium text-black-85 w-20 truncate shrink-0">{e.eventType}</span>
          <span className="text-black-45 truncate flex-1">{e.description}</span>
          <span className="text-black-25 text-[9px]">{e.actor}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
