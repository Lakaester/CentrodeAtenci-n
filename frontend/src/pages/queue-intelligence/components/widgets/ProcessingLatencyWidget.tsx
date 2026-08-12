import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { LatencyUI } from "../../mappers/queue.mapper";

interface Props { items: LatencyUI[]; state: "loading" | "empty" | "error" | "success" }

export function ProcessingLatencyWidget({ items, state }: Props) {
  const agg = useMemo(() => items.length ? { p50: Math.round(items.reduce((s, i) => s + i.p50, 0) / items.length), p95: Math.round(items.reduce((s, i) => s + i.p95, 0) / items.length), p99: Math.round(items.reduce((s, i) => s + i.p99, 0) / items.length), max: Math.max(...items.map((i) => i.max)) } : { p50: 0, p95: 0, p99: 0, max: 0 }, [items]);
  if (state !== "success") return <DashboardWidget title="Processing Latency" subtitle="Average latency" state={state} />;
  return (
    <DashboardWidget title="Processing Latency" subtitle="Average latency" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} samples</span><span className="text-success">P50: {agg.p50}ms</span><span className="text-warning">P95: {agg.p95}ms</span><span className="text-danger">P99: {agg.p99}ms</span><span className="text-black-45">Max: {agg.max}ms</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((l) => (
        <div key={l.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className="flex-1 font-medium text-black-85 truncate">{l.timestamp.slice(11, 16)}</span>
          <span className="text-black-45">{l.p50}ms</span>
          <span className="text-black-45">{l.p95}ms</span>
          <span className="text-black-45">{l.p99}ms</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
