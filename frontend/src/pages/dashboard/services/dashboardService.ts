import { api } from "@/lib/api";
import { filtersToParams } from "@/lib/filters";
import type { DashboardFilters } from "@/lib/filters";
import type { GerencialResponse, ResumenResponse } from "../dto/dashboard.dto";

/** Dashboard gerencial consolidado: una sola llamada para todos los widgets. */
export async function fetchGerencial(filters: DashboardFilters): Promise<GerencialResponse> {
  const params = filtersToParams(filters);
  const { data } = await api.get("/dashboard/gerencial", { params, timeout: 120_000 });
  return data.data as GerencialResponse;
}

/** Endpoint histórico (se conserva para otros consumidores). */
export async function fetchResumen(filters: DashboardFilters): Promise<ResumenResponse> {
  const params = filtersToParams(filters);
  const { data } = await api.get("/dashboard/resumen", { params });
  return data.data as ResumenResponse;
}
