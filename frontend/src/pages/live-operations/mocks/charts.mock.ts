import type { OperationalChartsDTO } from "../dto/operational-chart.dto";

export const MOCK_CHART_DTO: OperationalChartsDTO = {
  volumenCanal: [
    { name: "WhatsApp", value: 184, colorKey: "whatsapp" },
    { name: "Correo", value: 96, colorKey: "correo" },
  ],
  ticketsPrioridad: {
    categorias: ["Alta", "Media", "Baja"],
    series: [{ name: "Tickets", values: [25, 31, 28] }],
  },
  evolucionReciente: {
    categorias: Array.from({ length: 12 }, (_, i) => `${String(i * 5).padStart(2, "0")}:00`),
    series: [
      { name: "WhatsApp", values: [12, 15, 18, 14, 20, 22, 19, 25, 23, 18, 16, 14] },
      { name: "Correo", values: [6, 8, 7, 10, 12, 9, 11, 14, 13, 10, 8, 7] },
    ],
  },
  estadoAsesores: {
    categorias: ["Disponible", "Ocupado", "Pausa", "Offline"],
    series: [{ name: "Asesores", values: [12, 18, 4, 2] }],
  },
};
