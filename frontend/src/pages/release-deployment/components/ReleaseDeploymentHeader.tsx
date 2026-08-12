import { LiveRefreshIndicator } from "@/pages/live-operations/components/LiveRefreshIndicator";
import type { ReleaseState } from "../hooks/useReleaseDeployment";

const GREETING = (() => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches"; })();

interface Props { state: ReleaseState; lastUpdate: string | null; onRefresh: () => void }

export function ReleaseDeploymentHeader({ state, lastUpdate, onRefresh }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-dark">{GREETING} — Release & Deployment Center</h1>
        <p className="text-xs text-black-25">Enterprise Release Management</p>
      </div>
      <LiveRefreshIndicator lastUpdate={lastUpdate} loading={state === "loading"} onRefresh={onRefresh} />
    </div>
  );
}
