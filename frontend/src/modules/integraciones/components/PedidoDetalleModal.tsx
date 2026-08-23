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

export function PedidoDetalleModal({ pedido, onClose }: Props) {
  const [copiado, setCopiado] = useState(false);

  if (!pedido) return null;

  const jsonRespuesta = campo(pedido, "json_respuesta", "respuesta", "response", "responseData");
  const esJson = jsonRespuesta.startsWith("{") || jsonRespuesta.startsWith("[");

  const copiar = async () => {
    await navigator.clipboard.writeText(jsonRespuesta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black-65/40 p-4">
      <div className="flex max-h-[85%] w-[640px] max-w-full flex-col overflow-hidden rounded-lg border border-black-10 bg-white shadow-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="text-xs font-semibold text-black-85">Respuesta del pedido</h3>
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
            <div><span className="text-black-25">Estado: </span>{campo(pedido, "estado", "status")}</div>
            <div><span className="text-black-25">StoreID: </span>{campo(pedido, "storeId", "store_id")}</div>
          </div>
          <label className="mb-1 block text-[9px] font-medium text-black-45">JSON de respuesta</label>
          {esJson ? (
            <pre className="max-h-[400px] overflow-auto rounded border border-black-5 bg-black-5 p-2 text-[9px] font-mono text-black-65 whitespace-pre-wrap">
              {jsonRespuesta}
            </pre>
          ) : (
            <p className="rounded border border-black-5 bg-black-5 p-2 text-[10px] text-black-65">{jsonRespuesta}</p>
          )}
        </div>
      </div>
    </div>
  );
}
