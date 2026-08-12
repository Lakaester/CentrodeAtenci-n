import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { RollbackUI } from "../../mappers/release.mapper";

interface Props { items: RollbackUI[]; state: "loading" | "empty" | "error" | "success" }

export function RollbackHistoryWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ executed: items.filter((i) => i.status === "Executed").length, pending: items.filter((i) => i.status === "Pending").length, cancelled: items.filter((i) => i.status === "Cancelled").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Rollback History" subtitle="Recent rollbacks" state={state} />;
  return (
    <DashboardWidget title="Rollback History" subtitle="Recent rollbacks" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} rollbacks</span><span className="text-warning">{agg.executed} executed</span><span className="text-primary">{agg.pending} pending</span><span className="text-black-25">{agg.cancelled} cancelled</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.statusColor}`}>{r.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{r.service}</span>
          <span className="text-black-25">{r.fromVersion} → {r.toVersion}</span>
          <span className="text-black-45 truncate max-w-[80px]">{r.reason}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
