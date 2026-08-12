import {
  Search, FileText, Shield, Wrench, MessageSquare, Tag, CheckCircle2,
  Clock, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActividadFE } from "./useTicketWorkspace";

const TIPO_ICON: Record<string, LucideIcon> = {
  identificacion: Search,
  diagnostico: Shield,
  consulta: FileText,
  gestion: Wrench,
  comunicacion: MessageSquare,
  clasificacion: Tag,
  cierre: CheckCircle2,
};

const TIPO_LABEL: Record<string, string> = {
  identificacion: "Identificación",
  diagnostico: "Diagnóstico",
  consulta: "Consulta",
  gestion: "Gestión",
  comunicacion: "Comunicación",
  clasificacion: "Clasificación",
  cierre: "Cierre",
};

const RESULTADO_COLOR: Record<string, string> = {
  ok: "bg-success-5 text-success border-emerald-200",
  error: "bg-danger-5 text-danger border-rose-200",
  pendiente: "bg-warning-5 text-warning-65 border-amber-200",
  informacion_no_disponible: "bg-black-5 text-black-65 border-slate-200",
};

function formatTimestamp(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const fecha = d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} ${hora}`;
}

function ActividadRow({ actividad, esUltima }: { actividad: ActividadFE; esUltima: boolean }) {
  const Icon = TIPO_ICON[actividad.tipo] ?? Clock;
  const label = TIPO_LABEL[actividad.tipo] ?? actividad.tipo;
  const resultadoLabel = actividad.resultado === "ok" ? "OK" :
    actividad.resultado === "error" ? "Error" :
    actividad.resultado === "pendiente" ? "Pendiente" : "No disponible";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black-5">
          <Icon size={12} className="text-black-45" />
        </div>
        {!esUltima && <div className="w-px flex-1 bg-black-10" />}
      </div>
      <div className={cn("min-w-0 flex-1 pb-4", esUltima && "pb-0")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">{label}</span>
            <span className="text-[10px] text-black-25">·</span>
            <span className="truncate text-[10px] text-black-45 capitalize">{actividad.subtipo.replace(/_/g, " ")}</span>
          </div>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium", RESULTADO_COLOR[actividad.resultado] ?? "")}>
            {resultadoLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-black-85">{actividad.descripcion}</p>
        {actividad.observaciones && (
          <p className="mt-0.5 text-[10px] text-black-25 italic">{actividad.observaciones}</p>
        )}
        <div className="mt-1 flex items-center gap-2 text-[9px] text-black-25">
          <span>{actividad.autor}</span>
          <span>·</span>
          <span>{formatTimestamp(actividad.fecha)}</span>
          {actividad.origen && (
            <>
              <span>·</span>
              <span className="capitalize">{actividad.origen === "agente" ? "Asesor" : actividad.origen}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  actividades: ActividadFE[];
}

export function TimelineActividades({ actividades }: Props) {
  const ordenadas = [...actividades].sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (ordenadas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Clock size={20} className="text-black-10" />
        <p className="text-xs text-black-25">Sin actividades registradas</p>
        <p className="text-[10px] text-black-10">Las actividades se registrarán automáticamente</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {ordenadas.map((act, i) => (
        <ActividadRow key={act.id} actividad={act} esUltima={i === ordenadas.length - 1} />
      ))}
    </div>
  );
}
