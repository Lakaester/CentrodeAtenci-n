import { cn } from "@/lib/utils";
import { KPI_VALUE_SIZE_CLASSES } from "./constants";
import type { KpiSize } from "./types";

interface Props {
  value: string | number;
  unit?: string;
  size?: KpiSize;
  className?: string;
}

export function KpiValue({ value, unit, size = "md", className }: Props) {
  return (
    <p className={cn("font-semibold tracking-tight text-black-85", KPI_VALUE_SIZE_CLASSES[size], className)}>
      {value}
      {unit && <span className="ml-1 text-sm font-medium text-black-25">{unit}</span>}
    </p>
  );
}
