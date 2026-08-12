import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { VersionUI } from "../../mappers/release.mapper";

interface Props { items: VersionUI[]; state: "loading" | "empty" | "error" | "success" }

export function CurrentVersionsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ stable: items.filter((i) => i.type === "Stable").length, candidate: items.filter((i) => i.type === "Candidate").length, beta: items.filter((i) => i.type === "Beta").length, hotfix: items.filter((i) => i.type === "Hotfix").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Current Versions" subtitle="Active versions" state={state} />;
  return (
    <DashboardWidget title="Current Versions" subtitle="Active versions" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} versions</span><span className="text-success">{agg.stable} stable</span><span className="text-warning">{agg.candidate} candidates</span><span className="text-primary">{agg.beta} beta</span><span className="text-danger">{agg.hotfix} hotfix</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((v) => (
        <div key={v.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${v.typeColor}`}>{v.type}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{v.service}</span>
          <span className="text-black-25">{v.version}</span>
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${v.envColor}`}>{v.environment}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
