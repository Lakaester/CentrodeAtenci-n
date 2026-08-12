import type { ReactNode } from "react";

export type TrendDirection = "up" | "down" | "flat";

export type KpiStatusVariant = "success" | "warning" | "danger" | "neutral";

export type KpiSize = "sm" | "md" | "lg";

export interface KpiTrend {
  value: number;
  direction: TrendDirection;
  label?: string;
  inverted?: boolean;
}

export interface KpiStatus {
  variant: KpiStatusVariant;
  label: string;
}

export interface KpiData {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: KpiTrend;
  status?: KpiStatus;
  href?: string;
  loading?: boolean;
  error?: string | null;
}
