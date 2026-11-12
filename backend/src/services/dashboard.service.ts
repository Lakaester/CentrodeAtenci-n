import { unificadoRepository } from "../repositories/unificado.repository";
import { dashboardGerencialRepository } from "../repositories/dashboardGerencial.repository";
import type { DashboardFilters } from "../types";

export const dashboardService = {
  async gerencial(filters: DashboardFilters) {
    return dashboardGerencialRepository.obtener(filters);
  },
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
  async clientesLista(
    filters: DashboardFilters,
    opts: { page?: number; pageSize?: number; search?: string; all?: boolean },
  ) {
    return unificadoRepository.clientesLista(filters, opts);
  },
  async clienteCategorias(filters: DashboardFilters, clave: string) {
    return unificadoRepository.clienteCategorias(filters, clave);
  },
  async clienteSubcategorias(
    filters: DashboardFilters,
    clave: string,
    categoria: string,
  ) {
    return unificadoRepository.clienteSubcategorias(filters, clave, categoria);
  },
  async clienteTickets(
    filters: DashboardFilters,
    params: {
      clave: string;
      categoria: string;
      subcategoria: string;
      page?: number;
      pageSize?: number;
      all?: boolean;
    },
  ) {
    return unificadoRepository.clienteTickets(filters, params);
  },
  async clienteEvolucion(
    filters: DashboardFilters,
    params: { clave: string; granularidad: "diaria" | "semanal" | "mensual" },
  ) {
    return unificadoRepository.clienteEvolucion(filters, params);
  },

  async whatsapp(filters: DashboardFilters) {
    return unificadoRepository.whatsapp(filters);
  },

  async zendesk(filters: DashboardFilters) {
    return unificadoRepository.zendesk(filters);
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
