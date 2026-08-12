import type { Indicadores } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: Indicadores;
}

function Chip({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs ">
      <span className={cn("h-2 w-2 rounded-full", color ?? "bg-[#64748B]")} />
      <span className="font-medium text-black-85">{value}</span>
      <span className="text-black-45">{label}</span>
    </div>
  );
}

export function IndicadoresHeader({ data }: Props) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-black-10 bg-light px-4 py-2.5">
      <Chip label="Tickets abiertos" value={data.ticketsAbiertos} color="bg-primary" />
      <Chip label="En proceso" value={data.enProceso} color="bg-primary" />
      <Chip label="Pendientes" value={data.pendientes} color="bg-amber-400" />
      <Chip label="Fuera SLA" value={data.fueraSLA} color="bg-danger-50" />
      <Chip label="Prom. espera" value={data.promedioEspera} />
      <Chip label="Prom. atención" value={data.promedioAtencion} />
    </div>
  );
}
