import { useState, useCallback } from "react";
import { RefreshCcw, Package, Plug } from "lucide-react";
import { useIntegraciones, useBusquedaPedidos } from "../hooks/useIntegraciones";
import { IntegracionesLista } from "./IntegracionesLista";
import { IntegracionesEmpty } from "./IntegracionesEmpty";
import { PedidosRecientes } from "./PedidosRecientes";
import { PedidoDrawer } from "./PedidoDrawer";
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

function hoyRangoCompleto(): [string, string] {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 16);
  const fin = now.toISOString().slice(0, 16);
  return [inicio, fin];
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
  // ── Estado local ──
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [pedidoConfirmacion, setPedidoConfirmacion] = useState<Pedido | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [filtros, setFiltros] = useState<PedidoFiltros>(() =>
    defaultFiltros(dominio ? [dominio] : [])
  );

  // ── Nivel 1: integraciones (automático) ──
  const {
    data: integracionesData,
    isLoading: cargandoIntegraciones,
    error: errorIntegraciones,
    refetch: refetchIntegraciones,
  } = useIntegraciones(dominio);

  const integraciones = integracionesData?.integraciones ?? [];

  // ── Nivel 2: pedidos (solo bajo demanda) ──
  const [pedidosPedidos, setPedidosPedidos] = useState(false);

  const {
    data: pedidosData,
    isLoading: cargandoPedidos,
    error: errorPedidos,
    refetch: refetchPedidos,
  } = useBusquedaPedidos(pedidosPedidos ? filtros : null, dominio, pedidosPedidos);

  const pedidos = pedidosData?.pedidos ?? [];
  const totalRegistros = pedidosData?.totalRegistros ?? 0;

  // ── Handlers ──
  const handleVerPedidos = useCallback(() => {
    const nuevosFiltros: PedidoFiltros = {
      suscripciones: dominio ? [dominio] : [],
      integraciones: [],
      storeIds: [],
      estados: [],
      fechas: hoyRangoCompleto(),
      pagina: 1,
      registros: 20,
    };
    setFiltros(nuevosFiltros);
    setPedidosPedidos(true);
  }, [dominio]);

  const handleVerTodos = useCallback(() => {
    setDrawerAbierto(true);
  }, []);

  const handleBuscarDrawer = useCallback((nuevosFiltros: PedidoFiltros) => {
    setFiltros(nuevosFiltros);
    setPedidosPedidos(true);
  }, []);

  const handlePaginaChange = useCallback((p: number) => {
    setFiltros((f) => ({ ...f, pagina: p }));
    // La query se re-ejecuta automáticamente al cambiar el queryKey (filtros)
  }, []);

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
            onClick={() => {
              refetchIntegraciones();
              if (pedidosPedidos) refetchPedidos();
            }}
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

      {/* ── BLOQUE A: Integraciones contratadas ── */}
      <div className="mb-3">
        <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-black-45">
          <Plug size={9} /> Integraciones contratadas
        </p>
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

      {/* ── BLOQUE B: Monitor de Integraciones (pedidos bajo demanda) ── */}
      {dominio && (
        <div className="border-t border-black-5 pt-2">
          <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-black-45">
            <Package size={9} /> Monitor de Integraciones
          </p>

          {/* Botón Ver pedidos (solo si hay integraciones y no se han pedido aún) */}
          {integraciones.length > 0 && !pedidosPedidos && (
            <button
              type="button"
              onClick={handleVerPedidos}
              className="inline-flex items-center gap-1.5 rounded border border-black-10 bg-white px-3 py-1.5 text-[10px] font-medium text-black-65 transition-colors hover:border-primary hover:text-primary"
            >
              <Package size={11} /> Ver pedidos
            </button>
          )}

          {/* Resumen de pedidos (compacto) */}
          {pedidosPedidos && (
            <div className="mt-2 space-y-2">
              <PedidosRecientes
                pedidos={pedidos}
                loading={cargandoPedidos}
                totalRegistros={totalRegistros}
                onVerTodos={handleVerTodos}
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
        </div>
      )}

      {/* ── Drawer: tabla completa de pedidos ── */}
      <PedidoDrawer
        abierto={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        pedidos={pedidos}
        totalRegistros={totalRegistros}
        loading={cargandoPedidos}
        filtros={filtros}
        integraciones={integraciones}
        pagina={filtros.pagina}
        registrosPorPagina={filtros.registros}
        onBuscar={handleBuscarDrawer}
        onPaginaChange={handlePaginaChange}
        onVerDetalle={setPedidoDetalle}
        onVerConfirmacion={setPedidoConfirmacion}
      />

      {/* Modales de detalle */}
      <PedidoDetalleModal pedido={pedidoDetalle} onClose={() => setPedidoDetalle(null)} />
      <PedidoConfirmacionModal pedido={pedidoConfirmacion} onClose={() => setPedidoConfirmacion(null)} />
    </section>
  );
}
