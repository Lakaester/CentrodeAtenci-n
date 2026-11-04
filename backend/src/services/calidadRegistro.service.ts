import { calidadRegistroRepository } from "../repositories/calidadRegistro.repository";
import type { DashboardFilters } from "../types";
import type { Granularidad } from "../types/calidadRegistro";

export const calidadRegistroService = {
  async obtener(filters: DashboardFilters, granularidad: Granularidad) {
    return calidadRegistroRepository.obtener(filters, granularidad);
  },
};
