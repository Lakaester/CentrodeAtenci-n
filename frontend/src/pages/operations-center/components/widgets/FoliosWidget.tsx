import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { FolioUI } from "../../mappers/infrastructure.mapper";

interface Props { items: FolioUI[]; state: "loading" | "empty" | "error" | "success" }

export function FoliosWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    available: items.reduce((s, i) => s + i.available, 0),
    used: items.reduce((s, i) => s + i.used, 0),
    remaining: items.reduce((s, i) => s + i.remaining, 0),
  }), [items]);

  if (state === "error") return <DashboardWidget title="Folios" subtitle="Sistema de folios" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Folios" subtitle="Sistema de folios" state="empty" />;

  return (
    <DashboardWidget title="Folios" subtitle="Sistema de folios" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{agg.available.toLocaleString()} disp.</span>
        <span className="text-black-45">{agg.used.toLocaleString()} usados</span>
        <span className="text-success">{agg.remaining.toLocaleString()} restantes</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${f.statusColor}`}>{f.status}</span>
            <span className="flex-1 font-medium text-black-85 truncate">{f.company}</span>
            <span className="text-black-45 w-16 text-right">{f.available.toLocaleString()}</span>
            <span className="text-black-45 w-16 text-right">{f.remaining.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
