import { useMemo } from "react";
import { LiveRefreshIndicator } from "@/pages/live-operations/components/LiveRefreshIndicator";
import type { IncidentState } from "../hooks/useIncidentCommand";

interface Props { state: IncidentState; lastUpdate: string | null; onRefresh: () => void }

export function IncidentCommandHeader({ state, lastUpdate, onRefresh }: Props) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-dark">
          {greeting} — Incident Command Center
        </h1>
        <p className="text-xs text-black-25">
          Centralized operational incident management.
        </p>
      </div>
      <LiveRefreshIndicator lastUpdate={lastUpdate} loading={state === "loading"} onRefresh={onRefresh} />
    </div>
  );
}
