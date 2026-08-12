import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function WidgetContainer({ children, className }: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
