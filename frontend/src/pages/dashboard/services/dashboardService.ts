import { api } from "@/lib/api";
import { filtersToParams } from "@/lib/filters";
import type { DashboardFilters } from "@/lib/filters";
import type { ResumenResponse } from "../dto/dashboard.dto";

export async function fetchResumen(filters: DashboardFilters): Promise<ResumenResponse> {
  const params = filtersToParams(filters);
  const { data } = await api.get("/dashboard/resumen", { params });
  return data.data as ResumenResponse;
}
