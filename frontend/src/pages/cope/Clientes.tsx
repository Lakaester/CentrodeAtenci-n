import { useState } from "react";
import { Users, Search, X } from "lucide-react";
import { useLocalbiSearch } from "@/modules/localbi";
import { HistoriaClinicaView } from "@/modules/localbi/components/HistoriaClinicaView";
import { SegmentoBadge, fmtMoneda } from "@/modules/localbi/components/HistoriaClinicaUI";
import type { LocalbiUnidadNegocio } from "@/modules/localbi";
import { cn } from "@/lib/utils";

export default function Clientes() {
  const [seleccion, setSeleccion] = useState<LocalbiUnidadNegocio | null>(null);
  const { busqueda, setBusqueda, result, isLoading } = useLocalbiSearch();

  const hayBusqueda = busqueda.trim().length > 0;
  const sinResultados = !isLoading && (result?.status === "success" || result?.status === "warning") && result.data.unidades.length === 0;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-black-10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
            <Users size={18} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-black-85">Clientes</h1>
            <p className="mt-0.5 text-xs text-black-45">
              Ficha operativa e Historia Clínica del cliente.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex w-80 shrink-0 flex-col border-r border-black-10 bg-white">
          <div className="shrink-0 border-b border-black-10 p-3">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-45" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar unidad de negocio..."
                className="h-8 w-full rounded border border-black-10 bg-white py-1.5 pl-8 pr-7 text-[11px] text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none"
              />
              {busqueda && (
                <button type="button" onClick={() => setBusqueda("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-black-45 hover:text-black-65">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded border border-black-5 bg-black-5" />
                ))}
              </div>
            )}

            {!isLoading && result?.status === "not_configured" && (
              <div className="p-4">
                <p className="text-[11px] font-medium text-warning-65">Historia del cliente no disponible</p>
                <p className="mt-1 text-[10px] text-black-45">{result.mensaje}</p>
              </div>
            )}

            {!isLoading && result?.status === "unavailable" && (
              <div className="p-4">
                <p className="text-[11px] font-medium text-danger">Localbi no disponible</p>
                <p className="mt-1 text-[10px] text-black-45">{result.mensaje}</p>
              </div>
            )}

            {!isLoading && (result?.status === "success" || result?.status === "warning") && (
              <div>
                {sinResultados ? (
                  <div className="p-4 text-center">
                    <p className="text-[11px] font-medium text-black-45">Cliente no encontrado</p>
                    <p className="mt-1 text-[10px] text-black-25">No encontramos unidades de negocio que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  result.data.unidades.map((u) => {
                    const activa = seleccion?.unidad_negocio === u.unidad_negocio;
                    return (
                      <button
                        key={u.unidad_negocio}
                        type="button"
                        onClick={() => setSeleccion(u)}
                        className={cn(
                          "flex w-full flex-col gap-1 border-b border-black-5 px-4 py-3 text-left transition-colors",
                          activa ? "bg-primary-5" : "hover:bg-light",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-[12px] font-semibold", activa ? "text-primary" : "text-black-85")}>{u.nombre}</span>
                          <SegmentoBadge segmento={u.segmento} />
                        </div>
                        <p className="truncate text-[10px] text-black-45">
                          {u.unidad_negocio} · {u.total_locales} locales · {fmtMoneda(u.pago_mensual)}
                        </p>
                        <p className="truncate text-[9px] text-black-25">
                          KAM: {u.cs?.localbi_kam || "—"} · {u.paises?.slice(0, 3).join(", ") || "—"}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto bg-light">
          {!seleccion ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-10 text-primary">
                <Users size={20} />
              </div>
              <p className="text-[12px] font-medium text-black-45">Busca y selecciona un cliente para ver su Historia Clínica</p>
              {hayBusqueda && sinResultados && (
                <p className="mt-1 text-[10px] text-black-25">Prueba con otro nombre o ID de unidad de negocio.</p>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-4xl p-6">
              <div className="rounded-lg border border-black-10 bg-white">
                <HistoriaClinicaView unidadNegocio={seleccion.unidad_negocio} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

