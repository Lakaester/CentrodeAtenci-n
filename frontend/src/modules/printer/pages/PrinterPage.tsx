import { useState } from "react";
import { RefreshCw, FileText, Flag } from "lucide-react";
import { FeatureFlagsTable } from "../components/FeatureFlagsTable";
import { LogsViewer } from "../components/LogsViewer";
import { usePrinter } from "../hooks/usePrinter";

const DEFAULT_DOMAIN = "demo.restaurant.pe";
const TABS = [
  { key: "inicio", label: "Inicio" },
  { key: "flags", label: "Feature Flags" },
  { key: "logs", label: "Logs" },
];

export default function PrinterPage() {
  const [tab, setTab] = useState("inicio");
  const { featureFlags, logs, loading, error, loadFeatureFlags, toggleFlag, loadLogs } = usePrinter();

  return (
    <div className="flex h-full flex-col bg-light">
      <div className="border-b border-black-10 bg-white px-4 py-3">
        <h1 className="text-sm font-semibold text-black-85">Printer</h1>
        <p className="text-[10px] text-black-45">Dominio: {DEFAULT_DOMAIN}</p>
      </div>

      <div className="flex gap-1 border-b border-black-10 bg-white px-4">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-[11px] font-medium transition-colors ${
              tab === t.key ? "border-b-2 border-[#2563EB] text-primary" : "text-black-45 hover:text-black-85"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mx-4 mt-3 rounded-md bg-danger-5 px-3 py-2 text-[11px] text-danger">{error}</div>}

      <div className="flex-1 overflow-y-auto">
        {tab === "inicio" && (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-sm text-black-45">Seleccione una acción</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setTab("flags"); loadFeatureFlags(DEFAULT_DOMAIN); }}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-black-10 bg-white px-4 py-2.5 text-[12px] font-medium text-black-85 hover:bg-light disabled:opacity-40">
                <Flag size={14} /> Consultar Feature Flags
              </button>
              <button type="button" onClick={() => setTab("logs")}
                className="inline-flex items-center gap-2 rounded-lg border border-black-10 bg-white px-4 py-2.5 text-[12px] font-medium text-black-85 hover:bg-light">
                <FileText size={14} /> Consultar Logs
              </button>
            </div>
          </div>
        )}

        {tab === "flags" && (
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <button type="button" onClick={() => loadFeatureFlags(DEFAULT_DOMAIN)} disabled={loading}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85 disabled:opacity-40">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                {loading ? "Cargando..." : "Obtener Feature Flags"}
              </button>
            </div>
            <FeatureFlagsTable flags={featureFlags} loading={loading} dominio={DEFAULT_DOMAIN}
              onToggle={(dom, name, val) => toggleFlag(dom, name, val)} />
          </div>
        )}

        {tab === "logs" && (
          <LogsViewer logs={logs} loading={loading} dominio={DEFAULT_DOMAIN}
            onConsultar={(dom, lineas, tipo) => loadLogs(dom, lineas, tipo)} />
        )}
      </div>
    </div>
  );
}
