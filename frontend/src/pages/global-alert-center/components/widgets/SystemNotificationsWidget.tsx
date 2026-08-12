import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { NotificationUI } from "../../mappers/globalAlert.mapper";

interface Props { items: NotificationUI[]; state: "loading" | "empty" | "error" | "success" }

export function SystemNotificationsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ info: items.filter((i) => i.type === "Info").length, warning: items.filter((i) => i.type === "Warning").length, unread: items.filter((i) => !i.read).length }), [items]);
  if (state !== "success") return <DashboardWidget title="System Notifications" subtitle="System notifications" state={state} />;
  return (
    <DashboardWidget title="System Notifications" subtitle="System notifications" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} notifications</span><span className="text-primary">{agg.info} info</span><span className="text-warning">{agg.warning} warning</span><span className="text-danger">{agg.unread} unread</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((n) => !n.read).slice(0, 5).map((n) => (
        <div key={n.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${n.typeColor}`}>{n.type}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{n.title}</span>
          <span className="text-black-25">{n.source}</span>
          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
