import type { OperationalKpiDTO } from "../dto/operational-kpi.dto";

export const MOCK_KPI_DTOS: OperationalKpiDTO[] = [
  { id: "tickets-activos", label: "Tickets Activos", value: 47, iconKey: "ticketsActivos", trendValue: 12, trendDirection: "up" },
  { id: "tickets-pendientes", label: "Tickets Pendientes", value: 23, iconKey: "ticketsPendientes", trendValue: 5, trendDirection: "down" },
  { id: "sla-riesgo", label: "SLA en Riesgo", value: 8, subtitle: "Próximos a vencer", iconKey: "slaEnRiesgo", trendValue: 3, trendDirection: "up", trendInverted: true },
  { id: "asesores-disponibles", label: "Asesores Disponibles", value: 12, iconKey: "asesoresDisponibles", trendValue: 2, trendDirection: "down", trendInverted: true },
  { id: "tiempo-espera", label: "Tiempo Promedio de Espera", value: 4, unit: "min", iconKey: "tiempoPromedioEspera", trendValue: 1, trendDirection: "up", trendInverted: true },
  { id: "conversaciones-activas", label: "Conversaciones Activas", value: 89, iconKey: "conversacionesActivas", trendValue: 15, trendDirection: "up" },
];
