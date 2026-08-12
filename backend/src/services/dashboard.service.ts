import { unificadoRepository } from "../repositories/unificado.repository";
import type { DashboardFilters } from "../types";

export const dashboardService = {
  async resumen(filters: DashboardFilters) {
    return unificadoRepository.resumen(filters);
  },
  async sla(filters: DashboardFilters) {
    return unificadoRepository.sla(filters);
  },
  async operacion(filters: DashboardFilters) {
    return unificadoRepository.operacion(filters);
  },
  async asesores(filters: DashboardFilters) {
    return unificadoRepository.asesores(filters);
  },
  async categorias(filters: DashboardFilters) {
    return unificadoRepository.categorias(filters);
  },
  async categoriasV2(filters: DashboardFilters) {
    return unificadoRepository.categoriasV2(filters);
  },

  async clientes(filters: DashboardFilters) {
    return unificadoRepository.clientes(filters);
  },
  async clientesV2(filters: DashboardFilters) {
    return unificadoRepository.clientesV2(filters);
  },

  async whatsapp(filters: DashboardFilters) {
    return unificadoRepository.whatsapp(filters);
  },

  async zendesk(filters: DashboardFilters) {
    return unificadoRepository.zendesk(filters);
  },

  async tendencias(filters: DashboardFilters) {
    return unificadoRepository.tendencias(filters);
  },

  async pais(filters: DashboardFilters) {
    return unificadoRepository.pais(filters);
  },
  async asesoresMatrix(filters: DashboardFilters) {
    return unificadoRepository.asesoresMatrix(filters);
  },
  async detalle(filters: DashboardFilters) {
    return unificadoRepository.detalle(filters);
  },
  async opciones() {
    return unificadoRepository.opciones();
  },
  async quejasDevoluciones(filters: DashboardFilters) {
    return unificadoRepository.quejasDevoluciones(filters);
  },
};
