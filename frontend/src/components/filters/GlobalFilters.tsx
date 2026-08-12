import { RotateCcw } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

/** Convierte "YYYY-MM-DD HH:mm" a "YYYY-MM-DDTHH:mm" para input datetime-local */
const toInput = (v: string | undefined) => v?.replace(" ", "T") ?? "";
/** Convierte "YYYY-MM-DDTHH:mm" de vuelta a "YYYY-MM-DD HH:mm" */
const fromInput = (v: string) => v.replace("T", " ");

export function GlobalFilters() {
  const { filters, setFilters } = useFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-black-10 bg-white px-6 py-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-black-45 uppercase tracking-wide">
        Inicio
      </div>
      <input
        type="datetime-local"
        value={toInput(filters.fechaHoraInicio)}
        onChange={(e) =>
          setFilters({ ...filters, fechaHoraInicio: e.target.value ? fromInput(e.target.value) : undefined })
        }
        className="rounded-lg border border-black-10 bg-light px-3 py-1.5 text-sm text-black-85 outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30"
      />
      <span className="text-black-25">→</span>
      <div className="flex items-center gap-1.5 text-xs font-medium text-black-45 uppercase tracking-wide">
        Fin
      </div>
      <input
        type="datetime-local"
        value={toInput(filters.fechaHoraFin)}
        onChange={(e) =>
          setFilters({ ...filters, fechaHoraFin: e.target.value ? fromInput(e.target.value) : undefined })
        }
        className="rounded-lg border border-black-10 bg-light px-3 py-1.5 text-sm text-black-85 outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30"
      />

      {(filters.fechaHoraInicio || filters.fechaHoraFin) && (
        <button
          onClick={() => setFilters({})}
          className="flex items-center gap-1 rounded-lg border border-black-10 px-3 py-1.5 text-xs text-black-45 hover:text-black-85 transition-colors"
          title="Limpiar filtros"
        >
          <RotateCcw size={12} />
          Limpiar
        </button>
      )}
    </div>
  );
}
