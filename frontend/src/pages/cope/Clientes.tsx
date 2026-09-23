import { useState } from "react";
import { Users, Search, X } from "lucide-react";
import { useLocalbiSearch } from "@/modules/localbi";
import { HistoriaClinicaView } from "@/modules/localbi/components/HistoriaClinicaView";
import { Pagination } from "@/components/ui/Pagination";
import type { ResultadoBusquedaCliente } from "@/modules/localbi/types/localbi";
import { cn } from "@/lib/utils";
import { normalizeDomain } from "@/domain/normalizacion";

export default function Clientes() {
  const [seleccion, setSeleccion] = useState<ResultadoBusquedaCliente | null>(null);
  const { busqueda, setBusqueda, pagina, setPagina, result, isLoading } = useLocalbiSearch();

  const hayBusqueda = busqueda.trim().length > 0;
  const total = result?.status === "success" || result?.status === "warning" ? result.data.totalRegistros : 0;
  const resultados = result?.status === "success" || result?.status === "warning" ? result.data.resultados : [];
  const limit = result?.status === "success" || result?.status === "warning" ? result.data.limite : 20;
  const sinResultados = !isLoading && (result?.status === "success" || result?.status === "warning") && resultados.length === 0;

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
        <div className="flex w-[340px] shrink-0 flex-col border-r border-black-10 bg-white">
          <div className="shrink-0 border-b border-black-10 p-3">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-45" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                placeholder="Buscar dominio, local o unidad..."
                aria-label="Buscar dominio, local o unidad de negocio"
                className="h-8 w-full rounded border border-black-10 bg-white py-1.5 pl-8 pr-7 text-[11px] text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none"
              />
              {busqueda && (
                <button type="button" onClick={() => { setBusqueda(""); setPagina(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-black-45 hover:text-black-65">
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
                    <p className="mt-1 text-[10px] text-black-25">No encontramos dominios o unidades que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  resultados.map((r) => {
                    const activa = seleccion?.dominio === r.dominio;
                    return (
                      <button
                        key={r.dominio}
                        type="button"
                        onClick={() => setSeleccion(r)}
                        className={cn(
                          "flex w-full flex-col gap-0.5 border-b border-black-5 px-4 py-3 text-left transition-colors",
                          activa ? "bg-primary-5" : "hover:bg-light",
                        )}
                      >
                        <span className={cn("truncate text-[12px] font-semibold", activa ? "text-primary" : "text-black-85")}>
                          {normalizeDomain(r.dominio)}
                        </span>
                        {r.local && (
                          <span className="truncate text-[11px] text-black-65">
                            {r.local}
                          </span>
                        )}
                        <span className="truncate text-[10px] text-black-45">
                          Unidad: {r.unidad_negocio}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-black-10">
            <Pagination
              pagina={pagina}
              total={total}
              porPagina={limit}
              onCambiar={setPagina}
              etiqueta="clientes"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto bg-light">
          {!seleccion ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-10 text-primary">
                <Users size={20} />
              </div>
              <p className="text-[12px] font-medium text-black-45">Busca y selecciona un dominio para ver su Historia Clínica</p>
              {hayBusqueda && sinResultados && (
                <p className="mt-1 text-[10px] text-black-25">Prueba con otro dominio, local o nombre de unidad.</p>
              )}
            </div>
          ) : (
            <div className="p-5">
              <HistoriaClinicaView unidadNegocio={seleccion.unidad_negocio} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
