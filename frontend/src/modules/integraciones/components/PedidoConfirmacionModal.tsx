import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import type { Pedido } from "../types";

interface Props {
  pedido: Pedido | null;
  onClose: () => void;
}

function campo(p: Pedido, ...claves: string[]): string {
  for (const k of claves) {
    const v = p[k];
    if (v != null && v !== "") return typeof v === "object" ? JSON.stringify(v, null, 2) : String(v);
  }
  return "—";
}

export function PedidoConfirmacionModal({ pedido, onClose }: Props) {
  const [copiado, setCopiado] = useState(false);

  if (!pedido) return null;

  const confirmacion = campo(pedido, "respuesta", "confirmacion", "confirmResponse", "json_respuesta");

  // Intentar extraer mensaje legible del JSON de confirmación
  let mensajeLegible = confirmacion;
  try {
    const parsed = JSON.parse(confirmacion);
    if (Array.isArray(parsed) && parsed.length > 0) {
      mensajeLegible = parsed[0].mensaje ?? JSON.stringify(parsed[0], null, 2);
    } else if (parsed.mensaje) {
      mensajeLegible = parsed.mensaje;
    }
  } catch {
    // No es JSON, usar como texto plano
  }

  const copiar = async () => {
    await navigator.clipboard.writeText(confirmacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black-65/40 p-4">
      <div className="flex max-h-[80%] w-[480px] max-w-full flex-col overflow-hidden rounded-lg border border-black-10 bg-white shadow-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="text-xs font-semibold text-black-85">Estado de confirmación</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copiar}
              className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-45 hover:bg-light"
            >
              {copiado ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
            </button>
            <button type="button" onClick={onClose} className="text-black-45 hover:text-black-65">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-[10px]">
            <div><span className="text-black-25">Pedido: </span>{campo(pedido, "orderId", "order_id", "id")}</div>
            <div><span className="text-black-25">Integración: </span>{campo(pedido, "integracion", "integration")}</div>
          </div>
          <label className="mb-1 block text-[9px] font-medium text-black-45">Confirmación</label>
          <div className="rounded border border-black-5 bg-success-5 p-3 text-[11px] text-black-85">
            {mensajeLegible}
          </div>
        </div>
      </div>
    </div>
  );
}
