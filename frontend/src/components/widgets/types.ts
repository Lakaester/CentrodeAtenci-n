import type { ReactNode } from "react";

export type WidgetState = "loading" | "empty" | "error" | "success";

export interface WidgetConfig {
  id: string;
  title: string;
  subtitle?: string;
  minHeight?: number;
}

export interface WidgetSlot {
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}
