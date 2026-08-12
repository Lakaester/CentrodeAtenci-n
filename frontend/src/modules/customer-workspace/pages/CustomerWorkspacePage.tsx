import { useState } from "react";
import { useCustomerWorkspace } from "../hooks/useCustomerWorkspace";
import { WorkspaceLayout } from "../layout/WorkspaceLayout";
import { ResumenTab } from "../components/ResumenTab";
import { DiagnosticoTab } from "../components/DiagnosticoTab";
import { AmbienteTab } from "../components/AmbienteTab";
import { TicketsTab } from "../components/TicketsTab";
import { TimelineTab } from "../components/TimelineTab";
import { IATab } from "../components/IATab";

const TABS = [
  { key: "resumen", label: "Resumen" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "ambiente", label: "Ambiente" },
  { key: "tickets", label: "Tickets" },
  { key: "timeline", label: "Timeline" },
  { key: "ia", label: "IA" },
];

export default function CustomerWorkspacePage() {
  const [tab, setTab] = useState("resumen");
  const { data, handleAction } = useCustomerWorkspace();

  return (
    <WorkspaceLayout data={data}>
      <div className="flex gap-1 border-b border-black-10 bg-white px-4">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-[11px] font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-[#2563EB] text-primary"
                : "text-black-45 hover:text-black-85"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab data={data} />}
      {tab === "diagnostico" && <DiagnosticoTab />}
      {tab === "ambiente" && <AmbienteTab onAction={handleAction} />}
      {tab === "tickets" && <TicketsTab />}
      {tab === "timeline" && <TimelineTab />}
      {tab === "ia" && <IATab />}
    </WorkspaceLayout>
  );
}
