export interface PerformanceMetricDTO {
  id: string;
  label: string;
  value: number;
  unit?: string;
  trendValue?: number;
  trendDirection?: "up" | "down" | "flat";
  trendInverted?: boolean;
}

export interface PerformanceDTO {
  kpis: PerformanceMetricDTO[];
  evolucion: { categorias: string[]; valores: number[] };
}
