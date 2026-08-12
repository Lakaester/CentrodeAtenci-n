import type { ClienteInfo } from "./types";
import { Badge, Button } from "@/components/ui";

interface Props { data: ClienteInfo; loading?: boolean }

const PRIO_COLOR: Record<string, string> = {
  Alta: "bg-danger-5 text-danger border-rose-200",
  Media: "bg-warning-5 text-warning-65 border-amber-200",
  Baja: "bg-aqua-5 text-aqua border-sky-200",
};

const EST_COLOR: Record<string, string> = {
  "En progreso": "bg-primary-5 text-primary border-blue-200",
  "QA": "bg-purple-5 text-purple border-purple-200",
  "Pendiente": "bg-black-5 text-black-65 border-slate-200",
  "Resuelto": "bg-success-5 text-success border-emerald-200",
};

export function TabDeveloper({ data, loading }: Props) {
  if (loading) return <div className="space-y-2 p-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-black-10" />)}</div>;
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between rounded-lg border border-black-10 px-3 py-2.5">
        <div>
          <p className="text-[11px] text-black-45">Tickets DEV Abiertos</p>
          <p className="text-lg font-bold text-black-85">{data.ticketsDEV.length}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-black-45">Cerrados</p>
          <p className="text-lg font-bold text-success">5</p>
        </div>
      </div>

      <div className="space-y-1">
        {data.ticketsDEV.map((dev) => (
          <div key={dev.id} className="rounded-lg border border-black-10 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black-85">{dev.id}</span>
              <Badge variant="default" className={EST_COLOR[dev.estado] ?? ""}>{dev.estado}</Badge>
            </div>
            <p className="mt-0.5 text-black-45">{dev.titulo}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-black-25">
              <span className={PRIO_COLOR[dev.prioridad] ? `rounded border px-1 py-0 font-medium ${PRIO_COLOR[dev.prioridad]}` : ""}>{dev.prioridad}</span>
              <span>Creado: {dev.fechaCreacion}</span>
              <span>{dev.responsable !== "—" ? dev.responsable : "Sin asignar"}</span>
              <span className="ml-auto">{dev.tiempoAbierto}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="primary" className="flex-1 text-[10px] h-7">Abrir Ticket DEV</Button>
        <Button size="sm" variant="ghost" className="flex-1 text-[10px] h-7">Historial DEV</Button>
      </div>
    </div>
  );
}
