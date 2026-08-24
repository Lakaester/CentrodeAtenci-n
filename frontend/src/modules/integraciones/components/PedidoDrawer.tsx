import { useState, useEffect } from "react";
import { X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Pedido, PedidoFiltros, IntegracionItem } from "../types";
import {
  extraerOrderId,
  extraerStoreId,
  extraerIntegracion,
  extraerEstado,
  extraerConfirmacion,
  extraerFecha,
  fmtFechaHora,
} from "../utils/pedidoCampos";

interface Props {
  abierto: boolean;
  onClose: () => void;
  pedidos: Pedido[];
  totalRegistros: number;
  loading: boolean;
  filtros: PedidoFiltros;
  integraciones: IntegracionItem[];
  pagina: number;
  registrosPorPagina: number;
  onBuscar: (filtros: PedidoFiltros) => void;
  onPaginaChange: (p: number) => void;
  onVerDetalle: (pedido: Pedido) => void;
  onVerConfirmacion: (pedido: Pedido) => void;
}

function hoyRango(): [string, string] {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 16);
  const fin = now.toISOString().slice(0, 16);
  return [inicio, fin];
}

const totalPaginas = (total: number, porPagina: number) => Math.max(1, Math.ceil(total / porPagina));

export function PedidoDrawer({
  abierto,
  onClose,
  pedidos,
  totalRegistros,
  loading,
  filtros,
  integraciones,
  pagina,
  registrosPorPagina,
  onBuscar,
  onPaginaChange,
  onVerDetalle,
  onVerConfirmacion,
}: Props) {
  const [desde, setDesde] = useState(() => filtros.fechas[0] || hoyRango()[0]);
  const [hasta, setHasta] = useState(() => filtros.fechas[1] || hoyRango()[1]);
  const [intSeleccionadas, setIntSeleccionadas] = useState<Set<string>>(
    () => new Set(filtros.integraciones)
  );
  const [storeIdFiltro, setStoreIdFiltro] = useState(filtros.storeIds.join(", "));

  useEffect(() => {
    if (abierto) {
      setDesde(filtros.fechas[0] || hoyRango()[0]);
      setHasta(filtros.fechas[1] || hoyRango()[1]);
      setIntSeleccionadas(new Set(filtros.integraciones));
      setStoreIdFiltro(filtros.storeIds.join(", "));
    }
  }, [abierto, filtros]);

  const toggleIntegracion = (nombre: string) => {
    setIntSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  };

  const handleBuscar = () => {
    const storeIds = storeIdFiltro
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onBuscar({
      ...filtros,
      fechas: [desde, hasta],
      integraciones: [...intSeleccionadas],
      storeIds,
      pagina: 1,
    });
  };

  const paginas = totalPaginas(totalRegistros, registrosPorPagina);

  if (!abierto) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black-30 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[65] flex h-full w-[720px] max-w-full flex-col border-l border-black-10 bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="text-xs font-semibold text-black-85">Pedidos del dominio</h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-black-45">
              {totalRegistros} {totalRegistros === 1 ? "registro" : "registros"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-black-45 hover:bg-light"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="shrink-0 space-y-2 border-b border-black-5 bg-light px-4 py-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-0.5 block text-[9px] font-medium text-black-45">Desde</label>
              <input
                type="datetime-local"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="h-7 w-full rounded border border-black-10 px-1.5 text-[10px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[9px] font-medium text-black-45">Hasta</label>
              <input
                type="datetime-local"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="h-7 w-full rounded border border-black-10 px-1.5 text-[10px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[9px] font-medium text-black-45">StoreID</label>
              <input
                value={storeIdFiltro}
                onChange={(e) => setStoreIdFiltro(e.target.value)}
                placeholder="Separar por coma"
                className="h-7 w-full rounded border border-black-10 px-1.5 text-[10px] focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <label className="mb-0.5 block text-[9px] font-medium text-black-45">Integración</label>
              <div className="flex flex-wrap gap-1">
                {integraciones.map((int) => (
                  <button
                    key={int.nombre}
                    type="button"
                    onClick={() => toggleIntegracion(int.nombre)}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                      intSeleccionadas.has(int.nombre)
                        ? "bg-primary text-white"
                        : "border border-black-10 text-black-45 hover:bg-white"
                    }`}
                  >
                    {int.nombre}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleBuscar}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1 rounded bg-primary px-2.5 py-1 text-[9px] font-medium text-white hover:bg-primary-85 disabled:opacity-50"
            >
              {loading ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="ml-2 text-[10px] text-black-45">Cargando pedidos…</span>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="py-12 text-center text-[10px] text-black-45">
              No se encontraron pedidos para los filtros seleccionados.
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black-10 text-[8px] uppercase tracking-wider text-black-45">
                  <th className="px-3 py-2 font-medium">Fecha/hora</th>
                  <th className="px-3 py-2 font-medium">Integración</th>
                  <th className="px-3 py-2 font-medium">Pedido</th>
                  <th className="px-3 py-2 font-medium">StoreID</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Confirmación</th>
                  <th className="px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p, i) => (
                  <tr key={i} className="border-b border-black-5 text-[10px]">
                    <td className="whitespace-nowrap px-3 py-1.5 font-mono text-black-65">
                      {fmtFechaHora(extraerFecha(p))}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="rounded bg-primary-10 px-1 py-0.5 text-[8px] font-medium text-primary">
                        {extraerIntegracion(p)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-black-85">
                      {extraerOrderId(p)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-black-65">
                      {extraerStoreId(p)}
                    </td>
                    <td className="px-3 py-1.5">
                      <EstadoBadge estado={extraerEstado(p)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <ConfirmacionBadge estado={extraerConfirmacion(p)} />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onVerDetalle(p)}
                          className="rounded px-1.5 py-0.5 text-[8px] text-primary hover:bg-primary-5"
                          title="Ver respuesta"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => onVerConfirmacion(p)}
                          className="rounded px-1.5 py-0.5 text-[8px] text-primary hover:bg-primary-5"
                          title="Ver confirmación"
                        >
                          Conf.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {paginas > 1 && (
          <div className="flex shrink-0 items-center justify-between border-t border-black-10 px-3 py-2 text-[9px] text-black-45">
            <span>{totalRegistros} pedidos</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
                disabled={pagina <= 1}
                className="rounded border border-black-10 px-1.5 py-0.5 disabled:opacity-40"
              >
                <ChevronLeft size={11} />
              </button>
              <span>{pagina} / {paginas}</span>
              <button
                type="button"
                onClick={() => onPaginaChange(Math.min(paginas, pagina + 1))}
                disabled={pagina >= paginas}
                className="rounded border border-black-10 px-1.5 py-0.5 disabled:opacity-40"
              >
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "—" || !estado) return <span className="text-black-25">—</span>;
  const lower = estado.toLowerCase();
  const cls = lower.includes("confirm") || lower.includes("complet")
    ? "bg-success-5 text-success"
    : lower.includes("pend") || lower.includes("proces")
    ? "bg-warning-5 text-warning-65"
    : "bg-black-5 text-black-45";
  return <span className={`rounded px-1 py-0.5 text-[8px] font-medium ${cls}`}>{estado}</span>;
}

function ConfirmacionBadge({ estado }: { estado: string }) {
  if (estado === "—" || !estado) return <span className="text-black-25">—</span>;
  const lower = estado.toLowerCase();
  const cls = lower.includes("confirm")
    ? "bg-success-5 text-success"
    : lower.includes("pend") || lower.includes("error")
    ? "bg-warning-5 text-warning-65"
    : "bg-black-5 text-black-45";
  return <span className={`rounded px-1 py-0.5 text-[8px] font-medium ${cls}`}>{estado}</span>;
}
