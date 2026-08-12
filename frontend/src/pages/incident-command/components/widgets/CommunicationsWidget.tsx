import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { CommunicationUI } from "../../mappers/incident.mapper";

interface Props { items: CommunicationUI[]; state: "loading" | "empty" | "error" | "success" }

export function CommunicationsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ sent: items.filter((i) => i.status === "sent").length, pending: items.filter((i) => i.status === "pending").length, failed: items.filter((i) => i.status === "failed").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Communications" subtitle="Sent communications" state={state} />;
  return (
    <DashboardWidget title="Communications" subtitle="Sent communications" state="success">
      <div className="flex gap-3 mb-3 text-[10px]"><span className="font-medium text-black-85">{items.length} total</span><span className="text-success">{agg.sent} sent</span><span className="text-warning">{agg.pending} pending</span><span className="text-danger">{agg.failed} failed</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${c.status === "sent" ? "text-success bg-success-5" : c.status === "pending" ? "text-warning bg-warning-5" : "text-danger bg-danger-5"}`}>{c.status}</span>
          <span className="font-medium text-black-85 w-14 truncate">{c.channel}</span><span className="text-black-45 flex-1 truncate">{c.sentTo}</span><span className="text-black-25 truncate max-w-[100px]">{c.subject}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
