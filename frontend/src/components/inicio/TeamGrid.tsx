import type { Asesor } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: Asesor[];
}

const ESTADO_STYLES: Record<string, string> = {
  "Disponible": "bg-success-50",
  "Ocupado": "bg-warning-50",
  "En pausa": "bg-slate-400",
  "Fuera de línea": "bg-slate-300",
};

const ESTADO_BG: Record<string, string> = {
  "Disponible": "bg-success-5 text-success",
  "Ocupado": "bg-warning-5 text-warning-65",
  "En pausa": "bg-black-5 text-black-65",
  "Fuera de línea": "bg-black-5 text-slate-400",
};

export function TeamGrid({ data }: Props) {
  if (!data.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((asesor) => (
        <div
          key={asesor.id}
          className="flex items-center gap-3 rounded-xl border border-black-10 bg-white p-4  transition-colors"
        >
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-10 text-sm font-semibold text-primary">
              {asesor.iniciales}
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white", ESTADO_STYLES[asesor.estado])} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-black-85">{asesor.nombre}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", ESTADO_BG[asesor.estado])}>
                {asesor.estado}
              </span>
              <span className="text-xs text-black-45">
                {asesor.atencionesActivas} activas
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-black-25">
              <span className={cn("font-medium", asesor.sla >= 90 ? "text-success" : "text-danger")}>
                SLA {asesor.sla}%
              </span>
              <span>{asesor.ultimaActividad}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
