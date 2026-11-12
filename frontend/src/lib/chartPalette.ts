/**
 * Paleta única para gráficos y valores que no pueden usar clases Tailwind
 * (ECharts/SVG/canvas). Los valores HEX reflejan los tokens de index.css:
 * primary accesible, naranja de marca, carbón y semánticos.
 *
 * No es una segunda paleta de UI: es la representación HEX de los mismos tokens
 * para librerías que no resuelven variables CSS en canvas.
 */
export const CHART = {
  primary: "#B45309",
  brand: "#EE781F",
  charcoal: "#4C5B5F",
  success: "#1F7A5A",
  warning: "#B54708",
  danger: "#B42318",
  purple: "#7C3AED",
  magenta: "#BE185D",
  aqua: "#0F766E",
  yellow: "#CA8A04",
  soft: "#F5B27A",
  tint: "#FDE8D7",
  muted: "#6B7A7E",
  axis: "#6B7A7E",
  grid: "#E6EAEB",
  split: "#F2F4F4",
} as const;

/** Serie categórica estable para gráficos. */
export const CHART_SERIES = [
  CHART.primary,
  CHART.brand,
  CHART.success,
  CHART.danger,
  CHART.purple,
  CHART.aqua,
  CHART.magenta,
  CHART.yellow,
];

/** Colores semánticos de canal, compartidos por Dashboard y Reportes. */
export const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: CHART.success,
  WAMETA: CHART.success,
  WHATMETA: CHART.success,
  WHATICKET: CHART.brand,
  CORREO: CHART.primary,
  ZENDESK: CHART.purple,
  OTRO: CHART.warning,
};

export function channelColor(key: string): string {
  return CHANNEL_COLORS[key.toUpperCase().replace(/\s+/g, "")] ?? CHART.muted;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
