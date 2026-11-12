import { CHART } from "@/lib/chartPalette";

/**
 * Compatibilidad para consumidores históricos.
 * Los valores reflejan los tokens de index.css; no es una paleta paralela.
 */
export const colors = {
  primary: CHART.primary,
  primaryHover: "#7C2D12",
  primaryActive: "#6C2710",
  primaryLight: CHART.tint,
  secondary: CHART.brand,
  secondaryHover: "#D96A17",
  secondaryActive: CHART.primary,
  secondaryLight: CHART.tint,
  white: "#FFFFFF",
  background: "#F5F6F7",
  surface: "#FFFFFF",
  border: CHART.grid,
  success: CHART.success,
  successLight: "#EAF6F0",
  warning: CHART.warning,
  warningLight: "#FFF6EE",
  danger: CHART.danger,
  dangerLight: "#FEF3F2",
  text: CHART.charcoal,
  textSecondary: CHART.muted,
  textTertiary: "#8A9498",
} as const;
