import { useState } from "react";
import type { PedidoFiltros, IntegracionItem } from "../types";

interface Props {
  integraciones: IntegracionItem[];
  filtros: PedidoFiltros;
  onFiltrosChange: (f: PedidoFiltros) => void;
  onBuscar: () => void;
  loading: boolean;
}

function hoyRango(): [string, string] {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 16);
  const fin = now.toISOString().slice(0, 16);
  return [inicio, fin];
}

export function PedidosFiltros({ integraciones, filtros, onFiltrosChange, onBuscar, loading }: Props) {
  const [desde, setDesde] = useState(() => filtros.fechas[0] || hoyRango()[0]);
  const [hasta, setHasta] = useState(() => filtros.fechas[1] || hoyRango()[1]);
  const [intSeleccionadas, setIntSeleccionadas] = useState<Set<string>>(
    () => new Set(filtros.integraciones)
  );
  const [storeIdFiltro, setStoreIdFiltro] = useState(filtros.storeIds.join(", "));

  const toggleIntegracion = (nombre: string) => {
    setIntSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  };

  const aplicar = () => {
    const storeIds = storeIdFiltro
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onFiltrosChange({
      ...filtros,
      fechas: [desde, hasta],
      integraciones: [...intSeleccionadas],
      storeIds,
      pagina: 1,
    });
    onBuscar();
  };

  return (
    <div className="space-y-2 rounded border border-black-5 bg-light px-3 py-2">
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
            placeholder=" Separar por coma"
            className="h-7 w-full rounded border border-black-10 px-1.5 text-[10px] focus:border-primary focus:outline-none"
          />
        </div>
      </div>
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
                  : "border border-black-10 text-black-45 hover:bg-light"
              }`}
            >
              {int.nombre}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={aplicar}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[9px] font-medium text-white hover:bg-primary-85 disabled:opacity-50"
        >
          {loading ? "Buscando…" : "Buscar pedidos"}
        </button>
      </div>
    </div>
  );
}
