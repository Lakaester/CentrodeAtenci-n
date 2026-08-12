import { Activity } from "lucide-react";
import type { KpiData } from "@/components/kpi/types";
import type { ResumenResponse } from "../dto/dashboard.dto";

const VS_PERIODO_ANTERIOR = "vs período anterior";

function kpiDirection(direccion: string | null): "up" | "down" | "flat" {
  return direccion === "up" ? "up" : direccion === "down" ? "down" : "flat";
}

export function mapResumenToKpis(data: ResumenResponse): KpiData[] {
  const k = data.kpis;
  return [
    {
      id: "total",
      title: "Total Atenciones",
      value: k.total.valor ?? 0,
      icon: <Activity size={18} />,
      trend: k.total.deltaPct != null
        ? { value: Math.abs(k.total.deltaPct), direction: kpiDirection(k.total.direccion), label: VS_PERIODO_ANTERIOR }
        : undefined,
    },
    {
      id: "cerrados",
      title: "Cerrados",
      value: k.cerrados.valor ?? 0,
      icon: <Activity size={18} />,
      trend: k.cerrados.deltaPct != null
        ? { value: Math.abs(k.cerrados.deltaPct), direction: kpiDirection(k.cerrados.direccion), label: VS_PERIODO_ANTERIOR }
        : undefined,
    },
    {
      id: "sla",
      title: "Cumplimiento SLA",
      value: k.cumplimientoSlaPct.valor != null ? `${Math.round(k.cumplimientoSlaPct.valor)}%` : "—",
      icon: <Activity size={18} />,
      trend: k.cumplimientoSlaPct.deltaPct != null
        ? { value: Math.abs(k.cumplimientoSlaPct.deltaPct), direction: kpiDirection(k.cumplimientoSlaPct.direccion), label: VS_PERIODO_ANTERIOR }
        : undefined,
    },
    {
      id: "promResolucion",
      title: "Tiempo promedio",
      value: k.promResolucionMin.valor != null ? `${Math.round(k.promResolucionMin.valor)} min` : "—",
      icon: <Activity size={18} />,
      trend: k.promResolucionMin.deltaPct != null
        ? { value: Math.abs(k.promResolucionMin.deltaPct), direction: kpiDirection(k.promResolucionMin.direccion), inverted: true, label: VS_PERIODO_ANTERIOR }
        : undefined,
    },
  ];
}
