import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}

export function WidgetBody({ children, className, scroll }: Props) {
  return (
    <div className={cn(scroll ? "max-h-64 overflow-y-auto" : "", className)}>
      {children}
    </div>
  );
}
