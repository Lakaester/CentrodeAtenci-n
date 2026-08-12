import { AlertTriangle, TrendingUp, Users, Codepen } from "lucide-react";
import type { Alerta } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: Alerta[];
}

const ICON_MAP = {
  sla: AlertTriangle,
  volumen: TrendingUp,
  sobrecarga: Users,
  dev: Codepen,
} as const;

const SEVERITY_STYLES = {
  alta: "border-l-rose-500 bg-danger-5/50",
  media: "border-l-amber-400 bg-warning-5/50",
  baja: "border-l-sky-400 bg-aqua-5/50",
} as const;

const SEVERITY_DOTS = {
  alta: "bg-danger-50",
  media: "bg-amber-400",
  baja: "bg-sky-400",
} as const;

const TIPO_LABELS = {
  sla: "SLA",
  volumen: "Volumen",
  sobrecarga: "Carga",
  dev: "DEV",
} as const;

export function AlertList({ data }: Props) {
  if (!data.length) return null;

  return (
    <div className="space-y-2">
      {data.map((alerta) => {
        const Icon = ICON_MAP[alerta.tipo];
        return (
          <div
            key={alerta.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-black-10 border-l-4 p-3 transition-colors hover:border-black-10",
              SEVERITY_STYLES[alerta.severidad],
            )}
          >
            <Icon size={16} className="mt-0.5 shrink-0 text-black-45" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", SEVERITY_DOTS[alerta.severidad])} />
                <span className="text-xs font-medium uppercase text-black-45">{TIPO_LABELS[alerta.tipo]}</span>
              </div>
              <p className="mt-0.5 text-sm text-black-85">{alerta.mensaje}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
