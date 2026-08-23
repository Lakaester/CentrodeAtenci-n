import { Loader2 } from "lucide-react";
import type { Pedido } from "../types";

interface Props {
  pedidos: Pedido[];
  totalRegistros: number;
  loading: boolean;
  pagina: number;
  registrosPorPagina: number;
  onPaginaChange: (p: number) => void;
  onVerDetalle: (pedido: Pedido) => void;
  onVerConfirmacion: (pedido: Pedido) => void;
}

/** Extrae un valor seguro de un pedido (campos no conocidos con certeza). */
function campo(p: Pedido, ...claves: string[]): string {
  for (const k of claves) {
    const v = p[k];
    if (v != null && v !== "") return String(v);
  }
  return "—";
}

function fmtFecha(p: Pedido): string {
  const raw = campo(p, "fecha", "fecha_creacion", "createdAt", "date");
  if (raw === "—") return raw;
  try {
    return new Date(raw).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return raw;
  }
}

const totalPaginas = (total: number, porPagina: number) => Math.max(1, Math.ceil(total / porPagina));

export function PedidosTabla({
  pedidos,
  totalRegistros,
  loading,
  pagina,
  registrosPorPagina,
  onPaginaChange,
  onVerDetalle,
  onVerConfirmacion,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={16} className="animate-spin text-primary" />
        <span className="ml-2 text-[10px] text-black-45">Cargando pedidos…</span>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="py-6 text-center text-[10px] text-black-45">
        No se encontraron pedidos para los filtros seleccionados.
      </div>
    );
  }

  const paginas = totalPaginas(totalRegistros, registrosPorPagina);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-black-10 text-[8px] uppercase tracking-wider text-black-45">
            <th className="px-2 py-1.5 font-medium">Fecha</th>
            <th className="px-2 py-1.5 font-medium">Integración</th>
            <th className="px-2 py-1.5 font-medium">Pedido</th>
            <th className="px-2 py-1.5 font-medium">StoreID</th>
            <th className="px-2 py-1.5 font-medium">Estado</th>
            <th className="px-2 py-1.5 font-medium">Confirmación</th>
            <th className="px-2 py-1.5 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p, i) => (
            <tr key={i} className="border-b border-black-5 text-[10px]">
              <td className="px-2 py-1.5 text-black-65">{fmtFecha(p)}</td>
              <td className="px-2 py-1.5">
                <span className="rounded bg-primary-10 px-1 py-0.5 text-[8px] font-medium text-primary">
                  {campo(p, "integracion", "integration", "canal")}
                </span>
              </td>
              <td className="px-2 py-1.5 font-mono text-black-85">
                {campo(p, "orderId", "order_id", "pedido", "id")}
              </td>
              <td className="px-2 py-1.5 font-mono text-black-65">
                {campo(p, "storeId", "store_id", "store")}
              </td>
              <td className="px-2 py-1.5">
                <EstadoBadge estado={campo(p, "estado", "status")} />
              </td>
              <td className="px-2 py-1.5">
                <ConfirmacionBadge estado={campo(p, "estadoConfirmacion", "confirmacion", "confirmStatus")} />
              </td>
              <td className="px-2 py-1.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onVerConfirmacion(p)}
                    className="rounded px-1.5 py-0.5 text-[8px] text-primary hover:bg-primary-5"
                    title="Ver estado de confirmación"
                  >
                    Confirmación
                  </button>
                  <button
                    type="button"
                    onClick={() => onVerDetalle(p)}
                    className="rounded px-1.5 py-0.5 text-[8px] text-primary hover:bg-primary-5"
                    title="Ver respuesta"
                  >
                    Respuesta
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {paginas > 1 && (
        <div className="flex items-center justify-between border-t border-black-5 px-2 py-1.5 text-[9px] text-black-45">
          <span>{totalRegistros} pedidos</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
              disabled={pagina <= 1}
              className="rounded border border-black-10 px-1.5 py-0.5 disabled:opacity-40"
            >
              ←
            </button>
            <span>{pagina}/{paginas}</span>
            <button
              type="button"
              onClick={() => onPaginaChange(Math.min(paginas, pagina + 1))}
              disabled={pagina >= paginas}
              className="rounded border border-black-10 px-1.5 py-0.5 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
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
