import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SeguimientoGestion } from "@/modules/clientes-seguimiento/types";
import { fmtFechaHora } from "@/modules/clientes-seguimiento/utils";
import { EstadoBadge } from "./EstadoBadge";

export function HistorialTimeline({ gestiones }: { gestiones: SeguimientoGestion[] }) {
  if (!gestiones.length) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="Sin contactos registrados"
        description="La primera gestión aparecerá aquí con la hora, el resumen y el estado resultante."
      />
    );
  }

  return (
    <div className="relative">
      {gestiones.map((g, i) => (
        <div key={g.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < gestiones.length - 1 && (
            <span className="absolute left-[6px] top-4 h-full w-px bg-black-10" aria-hidden />
          )}
          <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-primary shadow" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-black-85">{fmtFechaHora(g.contactoAt)}</p>
              <EstadoBadge estado={g.estadoNuevo} />
              <span className="text-[11px] text-black-45">{g.usuario ?? "Sistema"}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-black-65">{g.resumen}</p>
            {g.proximoContactoAt && (
              <p className="mt-1 text-[11px] text-warning">
                Próximo contacto: {fmtFechaHora(g.proximoContactoAt)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
