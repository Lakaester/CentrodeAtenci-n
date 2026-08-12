import { api } from "@/lib/api";

export interface DashboardData {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number | null;
  healthStatus: string | null;
}

export async function fetchDashboardData(): Promise<DashboardData | null> {
  try {
    const { data } = await api.get("/dashboard/resumen", { params: {} });
    const k = data?.data?.kpis;
    if (!k) return null;
    return {
      totalTickets: k.total?.valor ?? 0,
      openTickets: (k.total?.valor ?? 0) - (k.cerrados?.valor ?? 0),
      avgResponseTime: k.promPrimeraRespMin?.valor ?? null,
      healthStatus: k.cumplimientoSlaPct?.valor != null
        ? k.cumplimientoSlaPct.valor >= 90 ? "good" : k.cumplimientoSlaPct.valor >= 70 ? "fair" : "poor"
        : null,
    };
  } catch {
    return null;
  }
}
