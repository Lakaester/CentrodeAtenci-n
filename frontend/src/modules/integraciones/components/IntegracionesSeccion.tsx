import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useIntegraciones, useBusquedaPedidos } from "../hooks/useIntegraciones";
import { IntegracionesLista } from "./IntegracionesLista";
import { IntegracionesEmpty } from "./IntegracionesEmpty";
import { PedidosFiltros } from "./PedidosFiltros";
import { PedidosTabla } from "./PedidosTabla";
import { PedidoDetalleModal } from "./PedidoDetalleModal";
import { PedidoConfirmacionModal } from "./PedidoConfirmacionModal";
import type { PedidoFiltros, Pedido } from "../types";

interface Props {
  dominio: string | null | undefined;
  embedded?: boolean;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFiltros(suscripciones: string[]): PedidoFiltros {
  return {
    suscripciones,
    integraciones: [],
    storeIds: [],
    estados: [],
    fechas: [hoyISO(), hoyISO()],
    pagina: 1,
    registros: 20,
  };
}

export function IntegracionesSeccion({ dominio, embedded }: Props) {
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [pedidoConfirmacion, setPedidoConfirmacion] = useState<Pedido | null>(null);

  const {
    data: integracionesData,
    isLoading: cargandoIntegraciones,
    error: errorIntegraciones,
    refetch: refetchIntegraciones,
  } = useIntegraciones(dominio);

  const integraciones = integracionesData?.integraciones ?? [];

  const [filtros, setFiltros] = useState<PedidoFiltros>(() =>
    defaultFiltros(dominio ? [dominio] : [])
  );

  const {
    data: pedidosData,
    isLoading: cargandoPedidos,
    error: errorPedidos,
    refetch: refetchPedidos,
  } = useBusquedaPedidos(filtros.suscripciones.length > 0 ? filtros : null);

  const pedidos = pedidosData?.pedidos ?? [];
  const totalRegistros = pedidosData?.totalRegistros ?? 0;

  const handleBuscar = () => {
    refetchPedidos();
  };

  const cardClass = embedded
    ? ""
    : "rounded-xl border border-black-10 bg-white p-4 shadow-sm";

  return (
    <section className={cardClass}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black-85">Monitor de Integraciones</h2>
        <div className="flex items-center gap-1.5">
          {integraciones.length > 0 && (
            <span className="rounded bg-success-5 px-1.5 py-0.5 text-[8px] font-medium text-success">
              {integraciones.length} {integraciones.length === 1 ? "integración" : "integraciones"}
            </span>
          )}
          <button
            type="button"
            onClick={() => { refetchIntegraciones(); if (filtros.suscripciones.length > 0) refetchPedidos(); }}
            className="rounded p-1 text-black-25 transition-colors hover:bg-light hover:text-black-45"
            title="Refrescar"
          >
            <RefreshCcw size={13} />
          </button>
        </div>
      </div>

      {/* Dominio badge */}
      {dominio && (
        <div className="mb-2 text-[9px] text-black-45">
          Dominio: <span className="font-medium text-black-65">{dominio}</span>
        </div>
      )}

      {/* Lista de integraciones */}
      <div className="mb-3">
        <IntegracionesLista
          integraciones={integraciones}
          loading={cargandoIntegraciones}
        />
        {errorIntegraciones && (
          <IntegracionesEmpty
            tipo="error"
            mensaje={errorIntegraciones.message}
            onReintentar={() => refetchIntegraciones()}
          />
        )}
        {!cargandoIntegraciones && !errorIntegraciones && dominio && integraciones.length === 0 && (
          <IntegracionesEmpty tipo="sin-integraciones" />
        )}
      </div>

      {/* Filtros + tabla de pedidos (solo si hay integraciones) */}
      {integraciones.length > 0 && (
        <div className="space-y-2">
          <PedidosFiltros
            integraciones={integraciones}
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onBuscar={handleBuscar}
            loading={cargandoPedidos}
          />
          <PedidosTabla
            pedidos={pedidos}
            totalRegistros={totalRegistros}
            loading={cargandoPedidos}
            pagina={filtros.pagina}
            registrosPorPagina={filtros.registros}
            onPaginaChange={(p) => setFiltros((f) => ({ ...f, pagina: p }))}
            onVerDetalle={setPedidoDetalle}
            onVerConfirmacion={setPedidoConfirmacion}
          />
          {errorPedidos && (
            <IntegracionesEmpty
              tipo="error"
              mensaje={errorPedidos.message}
              onReintentar={() => refetchPedidos()}
            />
          )}
        </div>
      )}

      {/* Modales */}
      <PedidoDetalleModal pedido={pedidoDetalle} onClose={() => setPedidoDetalle(null)} />
      <PedidoConfirmacionModal pedido={pedidoConfirmacion} onClose={() => setPedidoConfirmacion(null)} />
    </section>
  );
}
