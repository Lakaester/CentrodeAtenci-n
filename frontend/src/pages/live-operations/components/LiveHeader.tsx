import { LiveRefreshIndicator } from "./LiveRefreshIndicator";
import type { LiveState } from "../hooks/useLiveOperations";

interface Props {
  state: LiveState;
  lastUpdate: string | null;
  onRefresh: () => void;
}

const GREETING = (() => {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
})();

export function LiveHeader({ state, lastUpdate, onRefresh }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-dark">
          {GREETING} — Operaciones en vivo
        </h1>
        <p className="text-xs text-black-25">
          Monitoreo operativo en tiempo casi real
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
