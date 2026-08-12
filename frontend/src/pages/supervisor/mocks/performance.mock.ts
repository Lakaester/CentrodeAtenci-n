import type { PerformanceDTO } from "../dto/performance.dto";

export const MOCK_PERFORMANCE_DTO: PerformanceDTO = {
  kpis: [
    { id: "conversaciones", label: "Conversaciones atendidas", value: 284, trendValue: 12, trendDirection: "up" },
    { id: "sla", label: "SLA promedio", value: 87, unit: "%", trendValue: 3, trendDirection: "up" },
    { id: "tiempo-respuesta", label: "Tiempo promedio respuesta", value: 4, unit: "min", trendValue: 1, trendDirection: "up", trendInverted: true },
    { id: "tiempo-resolucion", label: "Tiempo promedio resolución", value: 28, unit: "min", trendValue: 5, trendDirection: "down", trendInverted: false },
    { id: "productividad", label: "Productividad", value: 94, unit: "%", trendValue: 2, trendDirection: "up" },
    { id: "ocupacion", label: "Ocupación promedio", value: 68, unit: "%", trendValue: 4, trendDirection: "up", trendInverted: true },
  ],
  evolucion: {
    categorias: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    valores: [82, 88, 85, 91, 87, 79, 74],
  },
};
