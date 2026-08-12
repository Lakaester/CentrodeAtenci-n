import type { ReactNode } from "react";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
}

export function WidgetSection({ title, children, className }: Props) {
  return (
    <DashboardSection title={title} className={className}>
      {children}
    </DashboardSection>
  );
}
