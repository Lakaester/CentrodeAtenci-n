import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { CalendarUI } from "../../mappers/release.mapper";

interface Props { items: CalendarUI[]; state: "loading" | "empty" | "error" | "success" }

export function ReleaseCalendarWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ scheduled: items.filter((i) => i.status === "scheduled").length, completed: items.filter((i) => i.status === "completed").length, cancelled: items.filter((i) => i.status === "cancelled").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Release Calendar" subtitle="Scheduled releases" state={state} />;
  return (
    <DashboardWidget title="Release Calendar" subtitle="Scheduled releases" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} events</span><span className="text-primary">{agg.scheduled} scheduled</span><span className="text-success">{agg.completed} completed</span><span className="text-black-25">{agg.cancelled} cancelled</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((i) => i.status !== "completed").slice(0, 5).map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${c.status === "scheduled" ? "text-primary bg-primary-5" : "text-black-25 bg-black-5"}`}>{c.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{c.title}</span>
          <span className="text-black-25 text-[9px]">{c.date}</span>
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${c.envColor}`}>{c.environment}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
