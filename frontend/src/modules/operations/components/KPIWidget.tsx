import type { OperationsKPI } from "../types";

interface Props {
  kpis: OperationsKPI;
}

export function KPIWidget({ kpis }: Props) {
  const items = [
    { label: "Health Score", value: `${kpis.healthScore}%`, color: kpis.healthScore >= 80 ? "text-success" : "text-warning" },
    { label: "SLA", value: kpis.sla !== null ? `${kpis.sla}%` : "—", color: "text-black-85" },
    { label: "Casos abiertos", value: String(kpis.casosAbiertos), color: "text-black-85" },
    { label: "Providers", value: `${kpis.providersDisponibles} disponibles`, color: "text-success" },
    { label: "MTTR", value: kpis.mttr !== null ? `${kpis.mttr}h` : "—", color: "text-black-45" },
    { label: "Workflow success", value: kpis.workflowSuccessRate !== null ? `${kpis.workflowSuccessRate}%` : "—", color: "text-black-45" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-black-10 bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-black-25">{item.label}</p>
          <p className={`mt-1 text-lg font-semibold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
