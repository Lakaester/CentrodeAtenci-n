import { DashboardWidget } from "@/components/widgets";
import type { EscalationUI } from "../../mappers/incident.mapper";

interface Props { items: EscalationUI[]; state: "loading" | "empty" | "error" | "success" }

export function EscalationsWidget({ items, state }: Props) {
  if (state !== "success") return <DashboardWidget title="Escalations" subtitle="Open escalations" state={state} />;
  return (
    <DashboardWidget title="Escalations" subtitle="Open escalations" state="success">
      <div className="flex gap-3 mb-3 text-[10px]"><span className="font-medium text-black-85">{items.length} escalations</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className="font-medium text-black-85 w-20 truncate">{e.level}</span>
          <span className="text-black-45 flex-1 truncate">{e.escalatedTo}</span>
          <span className="text-black-25 text-[9px]">by {e.escalatedBy}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
