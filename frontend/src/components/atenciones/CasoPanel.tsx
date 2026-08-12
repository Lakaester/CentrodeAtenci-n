import { useState } from "react";
import { ChevronDown, FileText, CheckCircle2, Circle, Target, FileEdit, Paperclip, Wrench, Flag, BookOpen, type LucideIcon } from "lucide-react";
import type { CasoData, EstadoCasoStep, ResultadoFinalCaso } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: CasoData;
}

const ESTADO_ICON: Record<EstadoCasoStep, LucideIcon> = {
  ticket_recibido: FileText,
  aceptado: CheckCircle2,
  diagnostico_iniciado: FileEdit,
  informacion_solicitada: FileText,
  cliente_respondio: CheckCircle2,
  diagnostico_finalizado: CheckCircle2,
  escalado: Flag,
  ticket_dev_creado: FileText,
  gestion_iniciada: FileEdit,
  esperando_cliente: Circle,
  esperando_desarrollo: Circle,
  esperando_tercero: Circle,
  solucionado: CheckCircle2,
  confirmado_cliente: CheckCircle2,
  categorizado: CheckCircle2,
  cerrado: CheckCircle2,
};

const ESTADO_LABEL: Record<EstadoCasoStep, string> = {
  ticket_recibido: "Ticket recibido",
  aceptado: "Aceptado",
  diagnostico_iniciado: "Diagnóstico iniciado",
  informacion_solicitada: "Información solicitada",
  cliente_respondio: "Cliente respondió",
  diagnostico_finalizado: "Diagnóstico finalizado",
  escalado: "Escalado",
  ticket_dev_creado: "Ticket DEV creado",
  gestion_iniciada: "Gestión iniciada",
  esperando_cliente: "Esperando cliente",
  esperando_desarrollo: "Esperando desarrollo",
  esperando_tercero: "Esperando tercero",
  solucionado: "Solucionado",
  confirmado_cliente: "Confirmado por cliente",
  categorizado: "Categorizado",
  cerrado: "Cerrado",
};

const RESULTADO_OPTS: { value: ResultadoFinalCaso; label: string; color: string }[] = [
  { value: "resuelto", label: "Resuelto", color: "bg-success-5 text-success border-emerald-200" },
  { value: "parcial", label: "Parcial", color: "bg-warning-5 text-warning-65 border-amber-200" },
  { value: "escalado", label: "Escalado", color: "bg-purple-5 text-purple border-purple-200" },
  { value: "pendiente", label: "Pendiente", color: "bg-black-5 text-black-65 border-slate-200" },
  { value: "sin_respuesta", label: "Sin respuesta", color: "bg-danger-5 text-danger border-rose-200" },
  { value: "duplicado", label: "Duplicado", color: "bg-aqua-5 text-aqua border-sky-200" },
];

function CollapsibleSection({ title, icon, defaultOpen, children }: { title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="rounded-lg border border-black-10">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-black-45">
        <ChevronDown size={12} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
        {icon}
        <span>{title}</span>
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

export function CasoPanel({ data }: Props) {
  const [checklist, setChecklist] = useState(data.checklist);
  const [resumen, setResumen] = useState(data.resumenEjecutivo);
  const [resultado, setResultado] = useState(data.resultado);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="space-y-2 p-4">
        {/* Objetivo */}
        <CollapsibleSection title="Objetivo del Caso" icon={<Target size={12} />}>
          <div className="rounded-lg border border-black-10 bg-[#F0F7FF] p-2.5 text-xs text-black-85">
            {data.objetivo}
          </div>
        </CollapsibleSection>

        {/* Próximo Paso */}
        <div className="rounded-lg border border-[#2563EB]/30 bg-[#F0F7FF] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Próximo Paso</p>
          <p className="mt-0.5 text-xs text-black-85">{data.proximoPaso}</p>
        </div>

        {/* Timeline */}
        <CollapsibleSection title="Timeline del Caso" icon={<FileText size={12} />}>
          <div className="relative space-y-0">
            {data.timeline.map((step, i) => {
              const Icon = ESTADO_ICON[step.estado];
              const isLast = i === data.timeline.length - 1;
              const isActive = i === data.timeline.length - 1;
              return (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      isActive ? "bg-primary text-white" : "bg-black-5 text-black-25",
                    )}>
                      <Icon size={12} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-black-10" />}
                  </div>
                  <div className={cn("min-w-0 flex-1 pb-4", isLast && "pb-0")}>
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-black-85")}>
                        {ESTADO_LABEL[step.estado]}
                      </p>
                      <span className="text-[10px] text-black-25">{step.fecha} {step.hora}</span>
                    </div>
                    <p className="text-[10px] text-black-45">por {step.usuario}</p>
                    <p className="mt-0.5 text-[11px] text-[#475569]">{step.comentario}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* Checklist */}
        <CollapsibleSection title="Checklist de Resolución" icon={<CheckCircle2 size={12} />}>
          <div className="space-y-1">
            {checklist.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  const next = [...checklist];
                  next[i] = { ...next[i], checked: !next[i].checked };
                  setChecklist(next);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-black-5 p-2 text-xs text-left transition-colors hover:bg-light"
              >
                {item.checked ? (
                  <CheckCircle2 size={14} className="shrink-0 text-success" />
                ) : (
                  <Circle size={14} className="shrink-0 text-black-10" />
                )}
                <span className={cn("text-black-85", item.checked && "text-black-25 line-through")}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Resumen Ejecutivo */}
        <CollapsibleSection title="Resumen Ejecutivo" icon={<FileEdit size={12} />}>
          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Escriba un resumen del caso para uso de IA..."
            className="w-full rounded-lg border border-black-10 bg-light p-2.5 text-xs text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:outline-none resize-none min-h-[60px]"
          />
        </CollapsibleSection>

        {/* Evidencias */}
        <CollapsibleSection title="Evidencias" icon={<Paperclip size={12} />}>
          <div className="space-y-1">
            {data.evidencias.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
                <span className={cn(
                  "rounded px-1 py-0.5 text-[9px] font-medium",
                  ev.tipo === "captura" && "bg-aqua-5 text-aqua",
                  ev.tipo === "log" && "bg-black-5 text-black-65",
                  ev.tipo === "enlace" && "bg-purple-5 text-purple",
                  ev.tipo === "adjunto" && "bg-warning-5 text-warning",
                  ev.tipo === "video" && "bg-danger-5 text-danger",
                )}>
                  {ev.tipo === "captura" ? "IMG" : ev.tipo.toUpperCase()}
                </span>
                <span className="text-black-85">{ev.nombre}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Herramientas */}
        <CollapsibleSection title="Herramientas Utilizadas" icon={<Wrench size={12} />}>
          <div className="flex flex-wrap gap-1">
            {data.herramientas.map((h, i) => (
              <span key={i} className="rounded-md bg-black-5 px-2 py-1 text-[10px] text-black-45">{h}</span>
            ))}
          </div>
        </CollapsibleSection>

        {/* Resultado Final */}
        <CollapsibleSection title="Resultado Final" icon={<Flag size={12} />}>
          <div className="flex flex-wrap gap-1.5">
            {RESULTADO_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResultado(opt.value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  resultado === opt.value
                    ? opt.color + " border-current"
                    : "border-black-10 text-black-45 hover:bg-black-5",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Lecciones */}
        <CollapsibleSection title="Lecciones Aprendidas" icon={<BookOpen size={12} />}>
          <div className="space-y-1">
            {data.lecciones.map((lec, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
                <span className="mt-0.5 text-primary">•</span>
                <span className="text-black-85">{lec}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
