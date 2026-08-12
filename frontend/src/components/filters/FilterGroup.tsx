import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FilterGroup({ label, children, className }: Props) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="text-[11px] font-semibold uppercase tracking-wider text-black-45">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
