import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  inline?: boolean;
  className?: string;
}

export function FilterContainer({ children, inline, className }: Props) {
  if (inline) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 rounded-xl border border-black-10 bg-white p-4", className)}>
      {children}
    </div>
  );
}
