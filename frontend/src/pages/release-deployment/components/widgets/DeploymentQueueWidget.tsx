import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { QueueUI } from "../../mappers/release.mapper";

interface Props { items: QueueUI[]; state: "loading" | "empty" | "error" | "success" }

export function DeploymentQueueWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ queued: items.filter((i) => i.status === "queued").length, processing: items.filter((i) => i.status === "processing").length, completed: items.filter((i) => i.status === "completed").length, failed: items.filter((i) => i.status === "failed").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Deployment Queue" subtitle="Queued deployments" state={state} />;
  return (
    <DashboardWidget title="Deployment Queue" subtitle="Queued deployments" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} queued</span><span className="text-black-45">{agg.queued} queued</span><span className="text-primary">{agg.processing} processing</span><span className="text-success">{agg.completed} completed</span><span className="text-danger">{agg.failed} failed</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((i) => i.status !== "completed").slice(0, 5).map((q) => (
        <div key={q.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${q.status === "queued" ? "text-black-45 bg-black-5" : q.status === "processing" ? "text-primary bg-primary-5" : "text-danger bg-danger-5"}`}>{q.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{q.service}</span>
          <span className="text-black-25">{q.version}</span>
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${q.envColor}`}>{q.environment}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
