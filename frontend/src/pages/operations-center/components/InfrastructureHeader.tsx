import { useMemo } from "react";
import { LiveRefreshIndicator } from "@/pages/live-operations/components/LiveRefreshIndicator";
import type { HealthState } from "../hooks/useInfrastructureHealth";

interface Props { state: HealthState; lastUpdate: string | null; onRefresh: () => void }

export function InfrastructureHeader({ state, lastUpdate, onRefresh }: Props) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-dark">
          {greeting} — Infrastructure Health
        </h1>
        <p className="text-xs text-black-25">
          Monitoreo centralizado de la infraestructura Restaurant.pe
        </p>
      </div>
      <LiveRefreshIndicator lastUpdate={lastUpdate} loading={state === "loading"} onRefresh={onRefresh} />
    </div>
  );
}
