import { LiveRefreshIndicator } from "@/pages/live-operations/components/LiveRefreshIndicator";
import type { AlertCenterState } from "../hooks/useGlobalAlertCenter";
const G = (() => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches"; })();
interface Props { state: AlertCenterState; lastUpdate: string | null; onRefresh: () => void }
export function GlobalAlertCenterHeader({ state, lastUpdate, onRefresh }: Props) {
  return (<div className="flex items-center justify-between"><div><h1 className="text-lg font-semibold text-dark">{G} — Global Alert Center</h1><p className="text-xs text-black-25">Enterprise Operations Alert Console</p></div><LiveRefreshIndicator lastUpdate={lastUpdate} loading={state === "loading"} onRefresh={onRefresh} /></div>);
}
