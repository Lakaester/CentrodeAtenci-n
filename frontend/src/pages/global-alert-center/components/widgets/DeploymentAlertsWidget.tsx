import { DashboardWidget } from "@/components/widgets";
import type { DeployAlertUI } from "../../mappers/globalAlert.mapper";

interface Props { items: DeployAlertUI[]; state: "loading" | "empty" | "error" | "success" }

export function DeploymentAlertsWidget({ items, state }: Props) {
  if (state !== "success") return <DashboardWidget title="Deployment Alerts" subtitle="Deployment failure alerts" state={state} />;
  return (
    <DashboardWidget title="Deployment Alerts" subtitle="Deployment failure alerts" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} alerts</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.severityColor}`}>{a.severity}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{a.service}</span>
          <span className="text-black-25">{a.version}</span>
          <span className="text-black-45 truncate max-w-[80px]">{a.reason}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
