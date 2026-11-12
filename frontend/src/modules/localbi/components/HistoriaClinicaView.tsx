import {
  SeccionColapsable,
  Info,
  ND,
  fmtNps,
  HistoriaDensityProvider,
  useHistoriaDensity,
  type HistoriaDensity,
} from "./HistoriaClinicaUI";
import { useHistoriaClinicaData } from "../hooks/useHistoriaClinicaData";
import { HistorialFacturacion } from "@/modules/facturacion/components/HistorialFacturacion";
import { QdClienteHistorial } from "@/modules/quejas-devoluciones/components/QdClienteHistorial";
import { QdClienteHistorialCose } from "@/modules/quejas-devoluciones/components/QdClienteHistorialCose";
import { ResumenUnidad } from "./secciones/ResumenUnidad";
import { ActividadUnidad } from "./secciones/ActividadUnidad";
import { HistorialTransversalSeccion } from "./secciones/HistorialTransversalSeccion";

/**
 * Vista completa de la Historia Clínica del cliente/unidad.
 *
 * Consumida por HistoriaClientePanel (y otros). Compone las secciones del
 * Panel Operativo (Resumen + Actividad + Historial) y agrega los bloques
 * que solo pertenecen a esta vista integral (NPS, Addons, Integraciones
 * placeholder). La carga de datos está centralizada en useHistoriaClinicaData.
 */
interface HistoriaClinicaViewProps {
  unidadNegocio: string;
  variant?: HistoriaDensity;
  dominioSeleccionado?: string;
  localSeleccionado?: string;
  unidadNombre?: string;
}

export function HistoriaClinicaView({
  unidadNegocio,
  variant = "compact",
  dominioSeleccionado,
  localSeleccionado,
  unidadNombre,
}: HistoriaClinicaViewProps) {
  return (
    <HistoriaDensityProvider value={variant}>
      <HistoriaClinicaContent
        unidadNegocio={unidadNegocio}
        dominioSeleccionado={dominioSeleccionado}
        localSeleccionado={localSeleccionado}
        unidadNombre={unidadNombre}
      />
    </HistoriaDensityProvider>
  );
}

function HistoriaClinicaContent({
  unidadNegocio,
  dominioSeleccionado,
  localSeleccionado,
  unidadNombre,
}: Omit<HistoriaClinicaViewProps, "variant">) {
  const data = useHistoriaClinicaData(unidadNegocio);
  const comfortable = useHistoriaDensity() === "comfortable";

  if (data.status.kind === "loading") {
    return (
      <div className="space-y-2 p-3">
        <div className="h-5 w-40 animate-pulse rounded bg-black-5" />
        <div className="h-3 w-56 animate-pulse rounded bg-black-5" />
        <div className="grid grid-cols-4 gap-1.5">
          <div className="h-10 animate-pulse rounded bg-black-5" />
          <div className="h-10 animate-pulse rounded bg-black-5" />
          <div className="h-10 animate-pulse rounded bg-black-5" />
          <div className="h-10 animate-pulse rounded bg-black-5" />
        </div>
        <div className="h-24 animate-pulse rounded bg-black-5" />
      </div>
    );
  }

  if (data.status.kind === "empty") {
    return <div className="p-3 text-[10px] text-black-25">No se pudo cargar la Historia Clínica.</div>;
  }

  if (data.status.kind === "not_configured" || data.status.kind === "unavailable" || data.status.kind === "error") {
    return (
      <div className="flex flex-col items-center p-6 text-center">
        <p className="text-[11px] font-semibold text-warning-65">{data.status.mensaje}</p>
        <button type="button" onClick={() => data.refetch()} className="mt-3 rounded bg-primary px-3 py-1.5 text-[10px] font-medium text-white hover:bg-primary-85">
          Reintentar
        </button>
      </div>
    );
  }

  const ficha = data.ficha!;
  const npsResumen = data.npsResumen;

  return (
    <>
      <div>
        {data.warnings.length > 0 && (
          <div className="mb-1 px-2.5 py-1 text-[9px] text-warning-65">{data.warnings.join(" · ")}</div>
        )}

        {/* Cabecera + Resumen KPIs + Dominios y locales */}
        <ResumenUnidad
          data={data}
          dominioSeleccionado={dominioSeleccionado}
          localSeleccionado={localSeleccionado}
          unidadNombre={unidadNombre}
        />

        {/* Módulos (parte de Actividad, pero se mantiene en la vista completa) */}
        <ActividadUnidad data={data} />

        {/* Addons (preparado — sin fuente real aún) */}
        <SeccionColapsable title="Addons">
          <p className="text-[10px] text-black-25">Sin información disponible. Pendiente de fuente LocalBI de addons.</p>
        </SeccionColapsable>

        {/* Integraciones (preparado — sin fuente real aún) */}
        <SeccionColapsable title="Integraciones">
          <p className="text-[10px] text-black-25">Sin información disponible. Pendiente de fuente LocalBI de integraciones.</p>
        </SeccionColapsable>

        {/* NPS */}
        <SeccionColapsable title="NPS">
          <Info label="Locales con NPS">{npsResumen?.locales_con_nps ?? <ND />}</Info>
          <Info label="Promedio">{fmtNps(npsResumen?.promedio)}</Info>
          <Info label="Promedio producto">{fmtNps(npsResumen?.promedio_producto)}</Info>
        </SeccionColapsable>

        {/* Historial de facturación (solo lectura) — vista completa usa TODOS los dominios */}
        <SeccionColapsable title="Historial de facturación">
          <HistorialFacturacion
            unidadNegocioId={ficha.unidadnegocio_id ?? null}
            dominios={ficha.dominios.map((d) => d.dominio)}
          />
        </SeccionColapsable>

        <SeccionColapsable title="Quejas y devoluciones">
          {comfortable ? (
            <QdClienteHistorialCose dominios={ficha.dominios.map((d) => d.dominio)} />
          ) : (
            <QdClienteHistorial dominios={ficha.dominios.map((d) => d.dominio)} />
          )}
        </SeccionColapsable>

        {/* Historial Transversal */}
        <HistorialTransversalSeccion data={data} />
      </div>
    </>
  );
}