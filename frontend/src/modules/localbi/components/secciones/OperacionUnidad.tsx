import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { SeccionColapsable, fmtFecha } from "../HistoriaClinicaUI";
import { HistorialFacturacion } from "@/modules/facturacion/components/HistorialFacturacion";
import { QdClienteHistorial } from "@/modules/quejas-devoluciones/components/QdClienteHistorial";
import { facturacionService } from "@/modules/facturacion/services/facturacionService";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { Link } from "react-router-dom";

/**
 * Sección OPERACIÓN del Panel Operativo.
 *
 * Concentra la información operativa de la unidad, relacionada por DOMINIO:
 *   - Historial de facturación (solo lectura).
 *   - Control de Facturación del dominio específico.
 *   - Quejas y Devoluciones del dominio específico.
 *
 * El contexto principal es `dominioIdentificado` (atencion.dominio_identificado).
 * Si la atención aún no tiene dominio, se muestra un estado vacío con la acción
 * de vincular dominio. NO mezcla registros de otros dominios de la unidad.
 */
export function OperacionUnidad({ data, dominioIdentificado }: {
  data: HistoriaClinicaData;
  dominioIdentificado: string | null;
}) {
  const ficha = data.ficha;
  const dominios = dominioIdentificado ? [dominioIdentificado] : [];

  // Control de Facturación del dominio específico (caso operativo).
  const { data: caso, isLoading: cargandoCaso } = useQuery({
    queryKey: ["facturacion", "caso-por-dominio", dominioIdentificado],
    queryFn: () => facturacionService.casoPorDominio(dominioIdentificado!),
    enabled: Boolean(dominioIdentificado),
    staleTime: 30_000,
    retry: 1,
  });

  return (
    <div className="space-y-0.5">
      {/* Dominio contexto */}
      <div className="border-b border-black-10 px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Contexto de operación</p>
        {dominioIdentificado ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-primary">{dominioIdentificado}</p>
        ) : (
          <p className="mt-0.5 text-[10px] text-warning-65">
            Sin dominio vinculado a esta atención. Usa <span className="font-medium">Vincular dominio</span> para operar.
          </p>
        )}
      </div>

      {/* Control de Facturación del dominio */}
      <SeccionColapsable title="Control de Facturación" defaultOpen={Boolean(dominioIdentificado)}>
        {!dominioIdentificado ? (
          <p className="text-[10px] text-black-25">Vincula un dominio para consultar el control de facturación.</p>
        ) : cargandoCaso ? (
          <p className="px-2.5 py-1 text-[10px] text-black-25">Consultando caso de facturación…</p>
        ) : !caso || !caso.caso?.id ? (
          <p className="px-2.5 py-1 text-[10px] text-black-25">Sin caso de facturación activo para este dominio.</p>
        ) : (
          <div className="space-y-1 px-2.5 pb-2">
            <div className="rounded border border-black-10 bg-light p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] font-semibold text-primary">{caso.caso.dominio}</span>
                <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-65">{caso.caso.estado_operativo}</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[9px] text-black-45">
                {caso.caso.ultimas_facturas != null && (
                  <div className="flex gap-1.5">
                    <span className="text-black-25">Últimas facturas:</span>
                    <span className="font-medium tabular-nums text-black-85">{caso.caso.ultimas_facturas}</span>
                  </div>
                )}
                {caso.caso.ultimas_boletas != null && (
                  <div className="flex gap-1.5">
                    <span className="text-black-25">Últimas boletas:</span>
                    <span className="font-medium tabular-nums text-black-85">{caso.caso.ultimas_boletas}</span>
                  </div>
                )}
                {caso.caso.proveedor && (
                  <div className="flex gap-1.5">
                    <span className="text-black-25">Proveedor:</span>
                    <span className="text-black-85">{caso.caso.proveedor}</span>
                  </div>
                )}
                {caso.caso.asesor_actual && (
                  <div className="flex gap-1.5">
                    <span className="text-black-25">Asesor:</span>
                    <span className="text-black-85">{caso.caso.asesor_actual}</span>
                  </div>
                )}
                {caso.caso.ultima_deteccion && (
                  <div className="flex gap-1.5">
                    <span className="text-black-25">Última detección:</span>
                    <span className="text-black-85">{fmtFecha(caso.caso.ultima_deteccion)}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              to={`/control-facturacion?dominio=${encodeURIComponent(caso.caso.dominio)}`}
              className="inline-flex items-center gap-1 text-[9px] text-primary hover:underline"
            >
              <ExternalLink size={9} /> Abrir Control de Facturación
            </Link>
          </div>
        )}
      </SeccionColapsable>

      {/* Historial de facturación (solo lectura) del dominio */}
      <SeccionColapsable title="Historial de facturación">
        {dominioIdentificado ? (
          <HistorialFacturacion unidadNegocioId={ficha?.unidadnegocio_id ?? null} dominios={dominios} />
        ) : (
          <p className="text-[10px] text-black-25">Vincula un dominio para consultar el historial de facturación.</p>
        )}
      </SeccionColapsable>

      {/* Quejas y devoluciones del dominio */}
      <SeccionColapsable title="Quejas y devoluciones">
        {dominioIdentificado ? (
          <QdClienteHistorial dominios={dominios} />
        ) : (
          <p className="text-[10px] text-black-25">Vincula un dominio para consultar quejas y devoluciones.</p>
        )}
      </SeccionColapsable>
    </div>
  );
}