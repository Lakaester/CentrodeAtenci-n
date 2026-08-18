import { useState } from "react";
import { Search } from "lucide-react";
import { useLocalbiSearch } from "@/modules/localbi";
import { HistoriaClinicaView } from "@/modules/localbi/components/HistoriaClinicaView";
import type { LocalbiUnidadNegocio } from "@/modules/localbi";

interface Preseleccion {
  unidad_negocio: string;
  nombre?: string;
}

interface Props {
  /** Unidad de negocio detectada automáticamente desde la atención (opcional). */
  unidadInicial?: Preseleccion | null;
}

export function HistoriaClientePanel({ unidadInicial }: Props) {
  const [seleccion, setSeleccion] = useState<LocalbiUnidadNegocio | null>(null);
  const [buscando, setBuscando] = useState(false);
  const { busqueda, setBusqueda, result, isLoading } = useLocalbiSearch();

  // Prioridad: selección manual del usuario > unidad detectada automáticamente.
  const unidadActual = seleccion ?? (unidadInicial
    ? { unidad_negocio: unidadInicial.unidad_negocio, nombre: unidadInicial.nombre ?? unidadInicial.unidad_negocio } as LocalbiUnidadNegocio
    : null);

  if (unidadActual) {
    return (
      <div>
        <div className="flex items-center justify-between px-2.5 py-1">
          <span className="truncate text-[10px] font-semibold text-black-85">{unidadActual.nombre || unidadActual.unidad_negocio}</span>
          <button type="button" onClick={() => setSeleccion(null)} className="text-[9px] text-primary hover:underline">
            Cambiar
          </button>
        </div>
        <HistoriaClinicaView unidadNegocio={unidadActual.unidad_negocio} />
      </div>
    );
  }

  return (
    <div className="p-2.5">
      <button type="button" onClick={() => setBuscando((v) => !v)} className="w-full rounded border border-black-10 px-2 py-1 text-left text-[10px] text-black-45 hover:bg-light">
        Seleccionar cliente…
      </button>

      {buscando && (
        <div className="mt-1.5">
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar unidad de negocio…"
              className="h-8 w-full rounded border border-black-10 bg-white py-1.5 pl-7 pr-2 text-[11px] text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mt-1 max-h-56 overflow-y-auto">
            {isLoading && <p className="p-2 text-[10px] text-black-25">Buscando…</p>}
            {!isLoading && result?.status === "not_configured" && (
              <p className="p-2 text-[10px] text-warning-65">Historia del cliente no disponible: falta configurar la credencial de LocalBI.</p>
            )}
            {!isLoading && result?.status === "unavailable" && (
              <p className="p-2 text-[10px] text-danger">{result.mensaje}</p>
            )}
            {!isLoading && (result?.status === "success" || result?.status === "warning") &&
              result.data.unidades.map((u) => (
                <button
                  key={u.unidad_negocio}
                  type="button"
                  onClick={() => { setSeleccion(u); setBuscando(false); }}
                  className="flex w-full flex-col border-b border-black-5 px-2 py-1.5 text-left hover:bg-light"
                >
                  <span className="truncate text-[11px] font-medium text-black-85">{u.nombre}</span>
                  <span className="truncate text-[9px] text-black-45">{u.unidad_negocio} · {u.total_locales} locales</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
