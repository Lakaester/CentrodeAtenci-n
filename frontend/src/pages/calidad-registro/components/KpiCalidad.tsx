import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { deltaClass } from "../format";

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  delta: number | null;
  deltaLabel?: "pp" | "%";
  goodUp?: boolean;
  accent?: string;
}

export function KpiCalidad({
  icon,
  label,
  value,
  hint,
  delta,
  deltaLabel = "pp",
  goodUp = true,
  accent,
}: Props) {
  const color = deltaClass(delta, goodUp);
  const Icon = delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  return (
    <div className="rounded-2xl border border-black-10 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-black-45">{label}</p>
          <p className={cn("mt-1.5 text-2xl font-bold tracking-tight", accent ?? "text-black-85")}>
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-10 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs font-medium">
        <Icon size={14} className={color} />
        <span className={color}>
          {delta == null
            ? "Sin comparativo"
            : `${delta > 0 ? "+" : ""}${
                Math.abs(delta) >= 1000
                  ? delta.toLocaleString("es-PE", { maximumFractionDigits: 1 })
                  : delta.toFixed(1)
              }${deltaLabel === "%" ? "%" : " pp"}`}
        </span>
        <span className="text-black-25">vs periodo anterior</span>
      </div>
      {hint && <p className="mt-1 text-xs text-black-25">{hint}</p>}
    </div>
  );
}
