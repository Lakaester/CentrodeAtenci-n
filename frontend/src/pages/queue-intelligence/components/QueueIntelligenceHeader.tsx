import { LiveRefreshIndicator } from "@/pages/live-operations/components/LiveRefreshIndicator";
import type { QueueState } from "../hooks/useQueueIntelligence";
const G = (() => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches"; })();
interface Props { state: QueueState; lastUpdate: string | null; onRefresh: () => void }
export function QueueIntelligenceHeader({ state, lastUpdate, onRefresh }: Props) {
  return (<div className="flex items-center justify-between"><div><h1 className="text-lg font-semibold text-dark">{G} — Queue Intelligence Center</h1><p className="text-xs text-black-25">Enterprise Queue Monitoring</p></div><LiveRefreshIndicator lastUpdate={lastUpdate} loading={state === "loading"} onRefresh={onRefresh} /></div>);
}
