import { CHART } from "@/lib/chartPalette";

export const CHART_PALETTE: Record<string, string> = {
  whatsapp: CHART.success,
  correo: CHART.primary,
  alta: CHART.danger,
  media: CHART.warning,
  baja: CHART.muted,
  disponible: CHART.success,
  ocupado: CHART.danger,
  pausa: CHART.warning,
  offline: CHART.muted,
};

export function getChartColor(key: string): string {
  return CHART_PALETTE[key] ?? CHART.primary;
}
