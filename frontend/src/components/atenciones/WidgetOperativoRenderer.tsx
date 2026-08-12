import {
  FileText, Clock, Shield, BarChart3, ExternalLink, RefreshCw, Send, List,
  AlertCircle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetOperativoFE, WidgetAccionFE } from "./useTicketWorkspace";

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, Clock, Shield, BarChart3, ExternalLink, RefreshCw, Send, List, AlertCircle,
};

function WidgetCard({ widget }: { widget: WidgetOperativoFE }) {
  const Icon = ICON_MAP[widget.icono ?? ""] ?? FileText;

  return (
    <div className={cn(
      "rounded-lg border p-3",
      widget.datosDisponibles ? "border-black-10 bg-white" : "border-amber-200 bg-warning-5/30",
    )}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black-5">
          <Icon size={15} className={widget.datosDisponibles ? "text-black-45" : "text-warning"} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-black-85">{widget.titulo}</p>
            {!widget.datosDisponibles && (
              <span className="shrink-0 rounded bg-warning-10 px-1.5 py-0.5 text-[9px] font-medium text-warning-65">
                No disponible
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-black-45">{widget.descripcion}</p>

          {!widget.datosDisponibles && widget.mensajeNoDisponible && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-warning-10/50 p-2">
              <AlertCircle size={11} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-[9px] text-warning-65">{widget.mensajeNoDisponible}</p>
            </div>
          )}

          {widget.acciones.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {widget.acciones.map((accion) => (
                <ActionChip key={accion.id} accion={accion} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionChip({ accion }: { accion: WidgetAccionFE }) {
  const Icon = ICON_MAP[accion.icono] ?? ExternalLink;

  return (
    <button
      disabled={!accion.disponible}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-medium transition-colors",
        accion.disponible
          ? "border-[#2563EB] bg-primary-5 text-primary hover:bg-primary hover:text-white"
          : "border-black-10 bg-light text-black-25 cursor-not-allowed",
      )}
    >
      <Icon size={10} />
      {accion.label}
    </button>
  );
}

function SectionBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 border-b border-black-10 pb-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface Props {
  widgets: WidgetOperativoFE[];
  seccion: string;
}

export function WidgetSeccionRenderer({ widgets, seccion }: Props) {
  const filtrados = widgets.filter((w) => w.seccion === seccion).sort((a, b) => a.orden - b.orden);
  if (filtrados.length === 0) return null;

  const labels: Record<string, string> = {
    diagnostico: "Diagnóstico",
    herramientas: "Herramientas",
    resultado: "Resultado",
  };

  const iconos: Record<string, React.ReactNode> = {
    diagnostico: <Shield size={12} className="text-[#6366F1]" />,
    herramientas: <BarChart3 size={12} className="text-primary" />,
    resultado: <FileText size={12} className="text-success" />,
  };

  return (
    <SectionBlock title={labels[seccion] ?? seccion} icon={iconos[seccion] ?? <FileText size={12} className="text-black-45" />}>
      {filtrados.map((w) => (
        <WidgetCard key={w.id} widget={w} />
      ))}
    </SectionBlock>
  );
}

export function GuiaResolucionRenderer({ guia }: { guia: { objetivo: string; pasos: string[]; buenasPracticas: string[] } | null | undefined }) {
  if (!guia) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-black-10 bg-[#F0F7FF] p-2.5">
        <p className="text-[10px] font-semibold text-primary">Objetivo</p>
        <p className="mt-0.5 text-xs text-black-85">{guia.objetivo}</p>
      </div>

      {guia.pasos.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-black-45">Pasos recomendados</p>
          <ol className="list-inside list-decimal space-y-1">
            {guia.pasos.map((paso, i) => (
              <li key={i} className="text-[11px] text-[#475569]">{paso}</li>
            ))}
          </ol>
        </div>
      )}

      {guia.buenasPracticas.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-black-45">Buenas prácticas</p>
          <ul className="space-y-1">
            {guia.buenasPracticas.map((bp, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#475569]">
                <span className="mt-0.5 text-success">•</span>
                <span>{bp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
