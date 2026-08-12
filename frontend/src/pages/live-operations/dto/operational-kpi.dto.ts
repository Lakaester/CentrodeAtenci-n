export interface OperationalKpiDTO {
  id: string;
  label: string;
  value: number;
  unit?: string;
  subtitle?: string;
  iconKey: string;
  trendValue?: number;
  trendDirection?: "up" | "down" | "flat";
  trendInverted?: boolean;
  statusVariant?: "success" | "warning" | "danger" | "neutral";
}
