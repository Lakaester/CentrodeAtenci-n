import { Loader2 } from "lucide-react";
import type { IntegracionItem } from "../types";

interface Props {
  integraciones: IntegracionItem[];
  loading: boolean;
}

export function IntegracionesLista({ integraciones, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-black-45">
        <Loader2 size={11} className="animate-spin" /> Cargando integraciones…
      </div>
    );
  }

  if (integraciones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {integraciones.map((int) => (
        <span
          key={int.nombre}
          className="inline-flex items-center gap-1 rounded bg-success-5 px-1.5 py-0.5 text-[9px] font-medium text-success"
        >
          {int.nombre}
          {int.storeIds.length > 0 && (
            <span className="text-success-65">({int.storeIds.length})</span>
          )}
        </span>
      ))}
    </div>
  );
}
