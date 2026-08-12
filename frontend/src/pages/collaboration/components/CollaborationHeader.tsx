import { useMemo } from "react";
import { LiveRefreshIndicator } from "@/pages/live-operations/components/LiveRefreshIndicator";
import type { CollaborationState } from "../hooks/useCollaboration";

interface Props {
  state: CollaborationState;
  lastUpdate: string | null;
  onRefresh: () => void;
}

export function CollaborationHeader({ state, lastUpdate, onRefresh }: Props) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-dark">
          {greeting} — Colaboración
        </h1>
        <p className="text-xs text-black-25">
          Notas internas, actividad reciente y seguimiento del equipo
        </p>
      </div>
      <LiveRefreshIndicator
        lastUpdate={lastUpdate}
        loading={state === "loading"}
        onRefresh={onRefresh}
      />
    </div>
  );
}
