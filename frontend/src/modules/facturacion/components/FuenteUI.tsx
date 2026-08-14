import { useState } from "react";
import { CheckCircle2, XCircle, PauseCircle, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Estados de fuente: NO_CONECTADA / ERROR / loading
 * ============================================================ */

export function FuenteNotConfigured({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-5 text-warning">
          <RefreshCw size={20} />
        </div>
        <h3 className="text-sm font-semibold text-black-85">Fuente de facturación pendiente de conexión</h3>
        <p className="mt-1 text-xs text-black-45">{mensaje || "Los documentos pendientes aparecerán aquí cuando la fuente de facturación esté conectada."}</p>
        <button type="button" onClick={onReintentar} className="mt-4 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85">
          <RefreshCw size={13} /> Reintentar conexión
        </button>
      </div>
    </div>
  );
}

export function FuenteUnavailable({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-5 text-danger">
          <XCircle size={20} />
        </div>
        <h3 className="text-sm font-semibold text-black-85">Fuente temporalmente no disponible</h3>
        <p className="mt-1 text-xs text-black-45">{mensaje}</p>
        <button type="button" onClick={onReintentar} className="mt-4 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85">
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * Resultado de un paso del proceso de reenvío
 * ============================================================ */

export interface ResultadoPasoFacturacion {
  nombre: string;
  estado: "ok" | "error" | "pendiente" | "no_ejecutado";
  documentos?: number | null;
  mensaje?: string | null;
  httpCode?: number | null;
}

export function ResultadoProcesoFacturacion({ pasos }: { pasos: ResultadoPasoFacturacion[] }) {
  if (!pasos || pasos.length === 0) return null;
  return (
    <div className="space-y-1">
      {pasos.map((p, i) => (
        <div key={i} className="rounded border border-black-10 bg-white p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-black-85">{p.nombre}</span>
            <span className="shrink-0">
              {p.estado === "ok" && <CheckCircle2 size={14} className="text-success" />}
              {p.estado === "error" && <XCircle size={14} className="text-danger" />}
              {p.estado === "no_ejecutado" && <PauseCircle size={14} className="text-black-25" />}
              {p.estado === "pendiente" && <RefreshCw size={14} className="text-warning" />}
            </span>
          </div>
          {p.estado === "ok" && p.documentos != null && (
            <p className="mt-0.5 text-[9px] text-success">{p.documentos} documento(s) procesados</p>
          )}
          {p.estado === "error" && (
            <div className="mt-0.5">
              <p className="text-[9px] font-medium text-danger">Error</p>
              {p.mensaje && <p className="text-[9px] text-danger-65">{p.mensaje}</p>}
              {p.httpCode != null && <p className="text-[9px] text-black-25">HTTP {p.httpCode}</p>}
            </div>
          )}
          {p.estado === "no_ejecutado" && <p className="mt-0.5 text-[9px] text-black-25">No ejecutado</p>}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * Diagnóstico sugerido (preparado, sin algoritmo)
 * ============================================================ */

export function DiagnosticoSugerido({
  sugerido,
  onConfirmar,
  onElegirOtra,
}: {
  sugerido: string | null;
  onConfirmar: () => void;
  onElegirOtra: () => void;
}) {
  if (!sugerido) return null;
  return (
    <div className="rounded border border-primary-25 bg-primary-5 p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">Diagnóstico sugerido</p>
      <p className="mt-0.5 text-[11px] font-medium text-black-85">{sugerido}</p>
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" onClick={onConfirmar} className="rounded bg-primary px-2 py-1 text-[9px] font-medium text-white hover:bg-primary-85">Confirmar</button>
        <button type="button" onClick={onElegirOtra} className="rounded border border-black-10 px-2 py-1 text-[9px] text-black-45 hover:bg-light">Elegir otra</button>
      </div>
    </div>
  );
}

/* ============================================================
 * Detalle del error (con copiar)
 * ============================================================ */

export function DetalleError({ mensaje }: { mensaje: string | null | undefined }) {
  const [copiado, setCopiado] = useState(false);
  if (!mensaje) return null;
  const copiar = () => {
    navigator.clipboard?.writeText(mensaje).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  };
  return (
    <div className="rounded border border-danger-25 bg-danger-5 p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-danger">Detalle del error</p>
        <button type="button" onClick={copiar} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-danger hover:bg-danger-10">
          {copiado ? <Check size={11} /> : <Copy size={11} />} {copiado ? "Copiado" : "Copiar error"}
        </button>
      </div>
      <pre className={cn("mt-1 max-h-28 overflow-y-auto whitespace-pre-wrap text-[9px] text-danger-65")}>{mensaje}</pre>
    </div>
  );
}
