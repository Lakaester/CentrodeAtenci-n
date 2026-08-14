import { X } from "lucide-react";
import type { FacturacionDominioPendiente } from "../services/facturacionService";
import { DetalleError } from "./FuenteUI";

interface Props {
  caso: FacturacionDominioPendiente | null;
  onClose: () => void;
  onIniciarDiagnostico: () => void;
  onReenviar: () => void;
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="shrink-0 text-[9px] text-black-25">{label}</span>
      <span className="ml-2 max-w-[60%] truncate text-right text-[10px] font-medium text-black-85">{children}</span>
    </div>
  );
}

function ND() {
  return <span className="text-black-10">—</span>;
}

export function DrawerDetalleCaso({ caso, onClose, onIniciarDiagnostico, onReenviar }: Props) {
  if (!caso) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-black-10 bg-white">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="truncate text-xs font-semibold text-black-85">{caso.dominio}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-black-45 hover:bg-light"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 rounded-lg border border-black-10 bg-light p-3">
            <Fila label="Dominio">{caso.dominio || <ND />}</Fila>
            <Fila label="RUC">{caso.ruc || <ND />}</Fila>
            <Fila label="Proveedor">{caso.proveedor || <ND />}</Fila>
          </div>

          <div className="mb-4 rounded-lg border border-black-10 bg-light p-3">
            <Fila label="Facturas pendientes">{caso.facturasPendientes ?? 0}</Fila>
            <Fila label="Boletas pendientes">{caso.boletasPendientes ?? 0}</Fila>
            <Fila label="Total pendiente">{caso.totalPendiente ?? 0}</Fila>
          </div>

          <div className="mb-4 rounded-lg border border-black-10 bg-light p-3">
            <Fila label="Estado">{caso.estado || <ND />}</Fila>
            <Fila label="Subcategoría">{caso.subcategoria || <ND />}</Fila>
          </div>

          <div className="space-y-2">
            <DetalleError mensaje={caso.ultimoError} />
            {caso.ultimoResultado && (
              <div className="rounded border border-black-10 bg-light p-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Último resultado</p>
                <p className="mt-0.5 text-[10px] text-black-85">{caso.ultimoResultado}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-black-10 p-3">
          <button type="button" onClick={onIniciarDiagnostico} className="flex-1 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85">
            Iniciar diagnóstico
          </button>
          <button type="button" onClick={onReenviar} className="flex-1 rounded border border-primary bg-primary-5 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary-10">
            Reenviar
          </button>
        </div>
      </div>
    </div>
  );
}
