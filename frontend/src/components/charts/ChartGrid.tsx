import type { ReactNode } from "react";
import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";

interface Props {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function ChartGrid({ children, cols = 3, className }: Props) {
  return (
    <DashboardGrid cols={cols} className={className}>
      {children}
    </DashboardGrid>
  );
}
