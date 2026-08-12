import { Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceResponse } from "./useTicketWorkspace";

interface Props { workspace: WorkspaceResponse }

function obtenerRecomendacion(ws: WorkspaceResponse): { texto: string; tipo: "accion" | "info" | "alerta" } {
  const c = ws.contacto;
  const at = ws.areaTrabajo;
  const esp = ws.workspaceEspecializado;

  if (!c.dominio || c.dominio === "") return { texto: "Identifique el dominio del cliente para continuar.", tipo: "alerta" };
  if (!at?.clasificacion.tipoAtencion) return { texto: "No se ha clasificado la atención. Asigne un Tipo de Atención.", tipo: "alerta" };
  if (esp?.guia.procesoRecomendado.length) return { texto: esp.guia.procesoRecomendado[0], tipo: "accion" };
  if (c.categoriaActual) return { texto: `Revise el estado del caso en ${c.categoriaActual}.`, tipo: "info" };
  if (ws.centroResolucion.etapas.some((e) => e.activa)) {
    const activa = ws.centroResolucion.etapas.find((e) => e.activa);
    return { texto: `Avance en la etapa: ${activa?.nombre ?? "Resolución"}.`, tipo: "info" };
  }
  return { texto: "Revise la guía de resolución para continuar.", tipo: "info" };
}

export function SiguienteRecomendacion({ workspace }: Props) {
  const rec = obtenerRecomendacion(workspace);

  return (
    <div className={cn(
      "rounded-lg border p-3",
      rec.tipo === "alerta" ? "border-amber-200 bg-warning-5" : rec.tipo === "accion" ? "border-[#2563EB]/30 bg-[#F0F7FF]" : "border-black-10 bg-white",
    )}>
      <div className="flex items-start gap-2">
        <Lightbulb size={14} className={cn(
          "mt-0.5 shrink-0",
          rec.tipo === "alerta" ? "text-warning" : rec.tipo === "accion" ? "text-primary" : "text-black-25",
        )} />
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-xs font-medium",
            rec.tipo === "alerta" ? "text-amber-800" : rec.tipo === "accion" ? "text-primary" : "text-black-85",
          )}>
            {rec.tipo === "alerta" ? "Atención requerida" : rec.tipo === "accion" ? "Siguiente paso" : "Recomendación"}
          </p>
          <p className="mt-0.5 text-xs text-black-45">{rec.texto}</p>
        </div>
        <ArrowRight size={14} className="shrink-0 text-black-25" />
      </div>
    </div>
  );
}
