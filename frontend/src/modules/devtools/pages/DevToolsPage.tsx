import { RefreshCw, Activity } from "lucide-react";
import { useDevTools } from "../hooks/useDevTools";
import { EventLog } from "../components/EventLog";

export default function DevToolsPage() {
  const { events, types, loading, refresh } = useDevTools();

  return (
    <div className="flex h-full flex-col bg-light">
      <div className="flex items-center justify-between border-b border-black-10 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <h1 className="text-sm font-semibold text-black-85">Eventos</h1>
          <span className="text-[10px] text-black-45">{events.length} eventos</span>
        </div>
        <button type="button" onClick={refresh} disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-black-5">
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refrescar
        </button>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-0 overflow-hidden">
        <div className="col-span-2 overflow-y-auto border-r border-black-10 bg-white p-3">
          <h2 className="mb-2 text-[10px] uppercase tracking-wide text-black-25">Historial de eventos</h2>
          <EventLog events={events} />
        </div>
        <div className="overflow-y-auto bg-white p-3">
          <h2 className="mb-2 text-[10px] uppercase tracking-wide text-black-25">Tipos registrados</h2>
          <div className="space-y-1">
            {types.map((t: any) => (
              <div key={t.type} className="flex items-center gap-2 rounded border border-black-10 px-2 py-1.5 text-[10px]">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  t.severity === "error" ? "bg-danger-50" : t.severity === "warning" ? "bg-warning-50" : "bg-primary-50"
                }`} />
                <span className="font-medium text-black-85">{t.type}</span>
                <span className="ml-auto text-black-25">v{t.version}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
