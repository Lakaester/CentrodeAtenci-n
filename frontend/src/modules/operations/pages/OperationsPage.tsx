import { useEffect } from "react";
import { RefreshCw, Activity } from "lucide-react";
import { useOperations } from "../hooks/useOperations";
import { KPIWidget } from "../components/KPIWidget";
import { HealthWidget } from "../components/HealthWidget";

export default function OperationsPage() {
  const { dashboard, loading, error, load } = useOperations();

  useEffect(() => { load(); }, []);

  return (
    <div className="flex h-full flex-col bg-light">
      <div className="flex items-center justify-between border-b border-black-10 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <h1 className="text-sm font-semibold text-black-85">Centro de Operaciones</h1>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-black-5">
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refrescar
        </button>
      </div>

      {error && <div className="mx-4 mt-3 rounded-md bg-danger-5 px-3 py-2 text-[11px] text-danger">{error}</div>}

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {loading && !dashboard && <p className="text-sm text-black-45">Cargando dashboard...</p>}

        {dashboard && (
          <>
            <KPIWidget kpis={dashboard.kpis} />
            <HealthWidget health={dashboard.health} />

            <div className="rounded-lg border border-black-10 bg-white p-3">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-black-25">Casos por estado</p>
              {Object.keys(dashboard.casesByStatus).length === 0 ? (
                <p className="text-[11px] text-black-25">Sin datos</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(dashboard.casesByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-[11px]">
                      <span className="capitalize text-black-45">{status.replace("_", " ")}</span>
                      <span className="font-medium text-black-85">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
