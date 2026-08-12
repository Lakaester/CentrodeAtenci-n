import { Clock, ArrowRight, MessageSquare, CheckCircle, Gauge } from "lucide-react";
import type { GeneralStatus } from "./types";

interface Props {
  data: GeneralStatus;
}

function Card({ icon, label, value, color, hint }: { icon: React.ReactNode; label: string; value: string; color?: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-4  transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-black-45">{label}</p>
          <p className={color ? `mt-1 text-2xl font-bold tracking-tight ${color}` : "mt-1 text-2xl font-bold tracking-tight text-black-85"}>
            {value}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-10 text-primary">
          {icon}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-black-25">{hint}</p>}
    </div>
  );
}

export function StatusCards({ data }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card icon={<Clock size={18} />} label="Pendientes" value={String(data.pendientes)} />
      <Card icon={<ArrowRight size={18} />} label="En Proceso" value={String(data.enProceso)} hint="23 asesores asignados" />
      <Card icon={<MessageSquare size={18} />} label="Esperando Cliente" value={String(data.esperandoCliente)} />
      <Card icon={<CheckCircle size={18} />} label="Resueltos Hoy" value={String(data.resueltosHoy)} color="text-success" />
      <Card icon={<Gauge size={18} />} label="SLA Global" value={`${data.slaCumplimiento}%`} color={data.slaCumplimiento >= 90 ? "text-success" : "text-danger"} />
    </div>
  );
}
