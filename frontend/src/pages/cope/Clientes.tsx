import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Search, X } from "lucide-react";
import { useLocalbiSearch } from "@/modules/localbi";
import { HistoriaClinicaView } from "@/modules/localbi/components/HistoriaClinicaView";
import type { ResultadoBusquedaCliente } from "@/modules/localbi/types/localbi";
import { cn } from "@/lib/utils";
import { normalizeDomain } from "@/domain/normalizacion";

/** Paginación local de Clientes: encapsula el estilo sin tocar el componente global. */
function PaginationClientes({
  pagina,
  total,
  porPagina,
  onCambiar,
  etiqueta,
}: {
  pagina: number;
  total: number;
  porPagina: number;
  onCambiar: (n: number) => void;
  etiqueta: string;
}) {
  if (total === 0) return null;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <span className="text-[12px] text-black-65">
        {desde}–{hasta} de {total} {etiqueta}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
          className="inline-flex h-8 items-center rounded-md border border-black-10 bg-white px-2.5 text-[12px] text-black-65 hover:bg-light disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-1 text-[12px] text-black-65 tabular-nums">
          {pagina} / {paginas}
        </span>
        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= paginas}
          className="inline-flex h-8 items-center rounded-md border border-black-10 bg-white px-2.5 text-[12px] text-black-65 hover:bg-light disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

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
      <div className="shrink-0 border-b border-black-10 bg-white px-6 py-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-10 text-primary">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight text-black-85">Clientes</h1>
            <p className="mt-1 text-[14px] text-black-65">
              Ficha operativa e Historia Clínica del cliente.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex w-[300px] shrink-0 flex-col border-r border-black-10 bg-white">
          <div className="shrink-0 border-b border-black-10 p-4">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-45" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                placeholder="Buscar dominio, local o unidad..."
                aria-label="Buscar dominio, local o unidad de negocio"
                className="h-11 w-full rounded-lg border border-black-10 bg-white py-2 pl-10 pr-9 text-[14px] text-black-85 placeholder:text-black-45 focus:border-primary focus:outline-none"
              />
              {busqueda && (
                <button type="button" onClick={() => { setBusqueda(""); setPagina(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-black-45 hover:text-black-65">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg border border-black-5 bg-black-5" />
                ))}
              </div>
            )}

            {!isLoading && result?.status === "not_configured" && (
              <div className="p-4">
                <p className="text-[14px] font-medium text-warning-65">Historia del cliente no disponible</p>
                <p className="mt-1 text-[13px] text-black-65">{result.mensaje}</p>
              </div>
            )}

            {!isLoading && result?.status === "unavailable" && (
              <div className="p-4">
                <p className="text-[14px] font-medium text-danger">Localbi no disponible</p>
                <p className="mt-1 text-[13px] text-black-65">{result.mensaje}</p>
              </div>
            )}

            {!isLoading && (result?.status === "success" || result?.status === "warning") && (
              <div>
                {sinResultados ? (
                  <div className="p-5 text-center">
                    <p className="text-[14px] font-medium text-black-65">Cliente no encontrado</p>
                    <p className="mt-1 text-[13px] text-black-45">No encontramos dominios o unidades que coincidan con tu búsqueda.</p>
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
                          "flex w-full flex-col gap-1 border-b border-black-10 border-l-[3px] px-4 py-3.5 text-left transition-colors",
                          activa
                            ? "border-l-primary bg-primary-5"
                            : "border-l-transparent hover:bg-black-5",
                        )}
                      >
                        <span
                          className={cn(
                            "truncate text-[15px] font-semibold",
                            activa ? "text-primary" : "text-black-85",
                          )}
                          title={normalizeDomain(r.dominio)}
                        >
                          {normalizeDomain(r.dominio)}
                        </span>
                        {r.local && (
                          <span className="truncate text-[13px] text-black-65" title={r.local}>
                            {r.local}
                          </span>
                        )}
                        <span className="truncate text-[12px] text-black-45" title={r.unidad_negocio}>
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
            <PaginationClientes
              pagina={pagina}
              total={total}
              porPagina={limit}
              onCambiar={setPagina}
              etiqueta="clientes"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto bg-black-5">
          {!seleccion ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-10 text-primary">
                <Users size={22} />
              </div>
              <p className="text-[14px] font-medium text-black-65">Busca y selecciona un dominio para ver su Historia Clínica</p>
              {hayBusqueda && sinResultados && (
                <p className="mt-1 text-[13px] text-black-45">Prueba con otro dominio, local o nombre de unidad.</p>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-hidden rounded-xl border border-black-10 bg-white shadow-sm">
                <HistoriaClinicaView
                  unidadNegocio={seleccion.unidad_negocio}
                  variant="comfortable"
                  dominioSeleccionado={seleccion.dominio}
                  localSeleccionado={seleccion.local}
                  unidadNombre={seleccion.unidad_nombre}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
