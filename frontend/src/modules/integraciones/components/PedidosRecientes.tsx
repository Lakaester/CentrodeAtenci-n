import { Loader2, ArrowRight } from "lucide-react";
import type { Pedido } from "../types";
import { extraerHora, extraerIntegracion, extraerOrderId, extraerEstado } from "../utils/pedidoCampos";

interface Props {
  pedidos: Pedido[];
  loading: boolean;
  totalRegistros: number;
  onVerTodos: () => void;
}

export function PedidosRecientes({ pedidos, loading, totalRegistros, onVerTodos }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 py-4 text-[10px] text-black-45">
        <Loader2 size={11} className="animate-spin" /> Cargando pedidos recientes…
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="py-4 text-center text-[10px] text-black-45">
        No se encontraron pedidos para hoy.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[9px] font-medium text-black-65">
          {totalRegistros} {totalRegistros === 1 ? "pedido" : "pedidos"} recientes
        </p>
        <button
          type="button"
          onClick={onVerTodos}
          className="inline-flex items-center gap-0.5 text-[9px] font-medium text-primary hover:underline"
        >
          Ver todos <ArrowRight size={9} />
        </button>
      </div>
      <div className="space-y-0.5">
        {pedidos.slice(0, 5).map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded px-2 py-1 text-[9px] hover:bg-light"
          >
            <span className="w-10 font-mono text-black-45">{extraerHora(p)}</span>
            <span className="rounded bg-primary-10 px-1 py-0.5 text-[8px] font-medium text-primary">
              {extraerIntegracion(p)}
            </span>
            <span className="font-mono text-black-85">{extraerOrderId(p)}</span>
            <span className="ml-auto">
              <EstadoMini estado={extraerEstado(p)} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstadoMini({ estado }: { estado: string }) {
  if (estado === "—" || !estado) return <span className="text-black-25">—</span>;
  const lower = estado.toLowerCase();
  const cls = lower.includes("confirm")
    ? "bg-success-5 text-success"
    : lower.includes("pend")
    ? "bg-warning-5 text-warning-65"
    : "bg-black-5 text-black-45";
  return <span className={`rounded px-1 py-0.5 text-[8px] font-medium ${cls}`}>{estado}</span>;
}
