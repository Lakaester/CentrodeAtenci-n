import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function WidgetFooter({ children, className }: Props) {
  return (
    <div className={cn("border-t border-black-5 pt-3", className)}>
      {children}
    </div>
  );
}
