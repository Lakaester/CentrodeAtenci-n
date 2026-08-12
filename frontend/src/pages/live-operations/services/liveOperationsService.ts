import { api } from "@/lib/api";
import { filtersToParams } from "@/lib/filters";
import type { DashboardFilters } from "@/lib/filters";

export interface OperacionKpisRaw {
  horaPico: string | null;
  horaPicoValor: number | null;
  diaCargado: string | null;
  total: { valor: number | null; anterior: number | null; deltaPct: number | null; direccion: string | null };
  promedioPorDia: { valor: number | null; anterior: number | null; deltaPct: number | null; direccion: string | null };
}

export interface OperacionResponse {
  kpis: OperacionKpisRaw;
  tendenciaDiaria: { fecha: string; total: number }[];
  curvaHora: { hora: number; total: number }[];
}

export async function fetchOperacion(filters: DashboardFilters): Promise<OperacionResponse> {
  const params = filtersToParams(filters);
  const { data } = await api.get("/dashboard/operacion", { params });
  return data.data as OperacionResponse;
}
