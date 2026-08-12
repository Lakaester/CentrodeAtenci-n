export const CHART_PALETTE: Record<string, string> = {
  whatsapp: "#10B981",
  correo: "#2563EB",
  alta: "#EF4444",
  media: "#F59E0B",
  baja: "#64748B",
  disponible: "#10B981",
  ocupado: "#EF4444",
  pausa: "#F59E0B",
  offline: "#94A3B8",
};

export function getChartColor(key: string): string {
  return CHART_PALETTE[key] ?? "#2563EB";
}
