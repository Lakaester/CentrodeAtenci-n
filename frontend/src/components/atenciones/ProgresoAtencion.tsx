import { cn } from "@/lib/utils";
import type { WorkspaceResponse } from "./useTicketWorkspace";

interface Props { workspace: WorkspaceResponse }

const ETAPAS = [
  { id: "cliente", label: "Cliente identificado", icon: "👤" },
  { id: "problema", label: "Problema comprendido", icon: "🔍" },
  { id: "analisis", label: "Análisis", icon: "📋" },
  { id: "resolucion", label: "Resolución", icon: "🔧" },
  { id: "comunicacion", label: "Comunicación", icon: "💬" },
  { id: "clasificacion", label: "Clasificación", icon: "🏷️" },
  { id: "cierre", label: "Cierre", icon: "✅" },
];

function determinarEtapaActual(ws: WorkspaceResponse): number {
  const estado = ws.ticket.status;
  if (estado === "CERRADO") return 6;
  if (ws.areaTrabajo?.clasificacion.tipoAtencion) return 5;
  if (ws.conversacion.items.length > 2) return 4;
  if (ws.workspaceEspecializado) return 3;
  if (ws.cliente360) return 1;
  return 0;
}

export function ProgresoAtencion({ workspace }: Props) {
  const etapaActual = determinarEtapaActual(workspace);

  return (
    <div className="rounded-lg border border-black-10 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {ETAPAS.map((etapa, i) => {
          const completada = i < etapaActual;
          const actual = i === etapaActual;
          return (
            <div key={etapa.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  completada ? "bg-success-50 text-white" : actual ? "bg-primary text-white" : "bg-black-5 text-black-25",
                )}>
                  {completada ? "✓" : actual ? etapa.icon : i + 1}
                </div>
                <span className={cn(
                  "text-[8px] font-medium text-center leading-tight max-w-[60px]",
                  completada ? "text-success" : actual ? "text-primary" : "text-black-25",
                )}>
                  {etapa.label}
                </span>
              </div>
              {i < ETAPAS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1", i < etapaActual ? "bg-emerald-400" : "bg-black-10")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
