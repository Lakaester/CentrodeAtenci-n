import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SeguimientoEstado } from "@/modules/clientes-seguimiento/types";
import { ESTADO_UI } from "@/modules/clientes-seguimiento/utils";

export function EstadoBadge({ estado }: { estado: SeguimientoEstado }) {
  const ui = ESTADO_UI[estado];
  return (
    <Badge variant={ui.badge} className="gap-1.5 whitespace-nowrap">
      <span className={cn("h-1.5 w-1.5 rounded-full", ui.dot)} />
      {ui.label}
    </Badge>
  );
}
