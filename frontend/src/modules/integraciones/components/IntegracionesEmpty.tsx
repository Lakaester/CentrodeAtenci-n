import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  tipo: "sin-integraciones" | "sin-pedidos" | "error" | "dominio-no-encontrado";
  mensaje?: string;
  onReintentar?: () => void;
}

const MENSAJES: Record<Props["tipo"], string> = {
  "sin-integraciones": "Este dominio no tiene integraciones registradas.",
  "sin-pedidos": "No se encontraron pedidos para los filtros seleccionados.",
  "error": "No fue posible consultar las integraciones.",
  "dominio-no-encontrado": "No se encontró información de integraciones para este dominio.",
};

export function IntegracionesEmpty({ tipo, mensaje, onReintentar }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <AlertCircle size={20} className="mb-2 text-black-25" />
      <p className="text-[11px] text-black-45">{mensaje || MENSAJES[tipo]}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-2 inline-flex items-center gap-1 rounded border border-black-10 px-2 py-0.5 text-[9px] text-primary hover:bg-light"
        >
          <RefreshCcw size={9} /> Reintentar
        </button>
      )}
    </div>
  );
}
