import { SeccionColapsable, SegmentoBadge, EstadoLocalBadge, fmtMoneda, fmtFecha, nombreLocal } from "../HistoriaClinicaUI";
import { normalizeDomain } from "@/domain/normalizacion";
import { LocalesDrawer } from "../LocalesDrawer";
import { HistoriaLocalDrawer } from "../HistoriaLocalDrawer";
import { useHistoriaLocal } from "../../hooks/useHistoriaClinica";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { cn } from "@/lib/utils";

/** KPI compacto del resumen. */
function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "warn" | "danger" | "plain" }) {
  const cls = tone === "ok" ? "text-success" : tone === "warn" ? "text-warning-65" : tone === "danger" ? "text-danger" : "text-black-85";
  return (
    <div className="rounded border border-black-10 bg-light px-2 py-1.5">
      <p className={cn("text-sm font-semibold leading-tight", cls)}>{value}</p>
      <p className="mt-0.5 text-[9px] text-black-45">{label}</p>
    </div>
  );
}

/**
 * Sección RESUMEN del Panel Operativo.
 *
 * Muestra:
 *   - Cabecera de la unidad (nombre, plan, KAM, pago, N locales).
 *   - KPIs en DOS filas de TRES cards: [Activos][Inactivos][Churn] /
 *     [Sin implementación][Total][Aporte]. NPS se oculta temporalmente
 *     (no se está midiendo; el dato/backend se conserva).
 *   - Dominios y locales (una unidad puede tener múltiples dominios).
 */
export function ResumenUnidad({ data }: { data: HistoriaClinicaData }) {
  const { ficha, locales } = data;
  const { data: historiaLocalData, isLoading: historiaLocalLoading } = useHistoriaLocal(
    ficha?.unidadnegocio_id ?? "",
    data.localSeleccionado,
  );

  if (!ficha) return null;

  const npsOculto = true; // NPS temporalmente oculto en el Panel Operativo.

  return (
    <div className="space-y-0.5">
      {/* Cabecera del cliente */}
      <div className="border-b border-black-10 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold text-black-85">{ficha.unidadnegocio_nombre || ficha.unidadnegocio_id}</h2>
          <div className="flex shrink-0 items-center gap-1.5">
            {data.isFetching && <span className="text-[9px] text-black-25">Actualizando…</span>}
            <button type="button" onClick={() => data.refetch()} className="rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-black-45 hover:bg-light">
              Actualizar
            </button>
          </div>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-black-45">{ficha.unidadnegocio_id}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-black-45">
          <SegmentoBadge segmento={ficha.segmento} />
          <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45">Plan: {ficha.plan || "—"}</span>
          <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45">KAM: {ficha.kam?.localbi_kam || "—"}</span>
          <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45">Pago: {fmtMoneda(ficha.pago_mensual)}</span>
          <button type="button" onClick={() => data.setLocalesOpen(true)} disabled={locales.length === 0}
            className={cn("rounded border px-1.5 py-0.5 text-[9px] text-primary hover:bg-primary-5 disabled:opacity-40", locales.length === 0 && "text-black-25")}>
            {locales.length} locales
          </button>
        </div>
      </div>

      {/* Resumen KPIs — DOS FILAS DE TRES */}
      <div className="border-b border-black-10 px-3 py-2.5">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-black-45">Resumen</p>
        <div className="grid grid-cols-3 gap-1.5">
          <Kpi label="Activos" value={ficha.resumen?.activos ?? "—"} tone="ok" />
          <Kpi label="Inactivos" value={ficha.resumen?.inactivos ?? "—"} />
          <Kpi label="Churn" value={ficha.resumen?.churn ?? "—"} tone={ficha.resumen?.churn ? "danger" : "plain"} />
          <Kpi label="Sin implementación" value={ficha.resumen?.sin_implementar ?? "—"} tone="warn" />
          <Kpi label="Total" value={ficha.resumen?.total ?? "—"} />
          <Kpi label="Aporte" value={ficha.resumen?.aporte_mensual_total != null ? fmtMoneda(ficha.resumen.aporte_mensual_total) : "—"} />
          {!npsOculto && (
            <Kpi label="NPS" value={ficha.resumen?.nps?.promedio != null ? String(ficha.resumen.nps.promedio) : "—"} tone="plain" />
          )}
        </div>
      </div>

      {/* Dominios y locales */}
      <SeccionColapsable title="Dominios y locales" defaultOpen badge={locales.length ? <span className="text-[9px] text-black-45">{locales.length} locales</span> : undefined}>
        {locales.length === 0 ? (
          <p className="text-[10px] text-black-25">Sin locales registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black-10 text-[9px] uppercase tracking-wider text-black-45">
                  <th className="px-1.5 py-1 font-medium">Local</th>
                  <th className="px-1.5 py-1 font-medium">País</th>
                  <th className="px-1.5 py-1 font-medium">Dominio</th>
                  <th className="px-1.5 py-1 font-medium">Estado</th>
                  <th className="px-1.5 py-1 font-medium">Plan</th>
                  <th className="px-1.5 py-1 text-right font-medium">Atenc.</th>
                  <th className="px-1.5 py-1 font-medium">Últ. atención</th>
                </tr>
              </thead>
              <tbody>
                {locales.map((l) => {
                  const domNorm = normalizeDomain(l.link_dominio || l.dominio);
                  const nombreIncidencias = data.soporteData?.nombreLocalPorDominio?.[domNorm];
                  const actLocal = data.actividadLocalData?.[l.localbi_id];
                  return (
                    <tr key={l.localbi_id} onClick={() => data.setLocalSeleccionado(l.localbi_id)}
                      className="cursor-pointer border-b border-black-5 hover:bg-light" title="Ver Historia del Local">
                      <td className="px-1.5 py-1 text-[10px] font-medium text-black-85">
                        {nombreLocal(l, nombreIncidencias)}
                      </td>
                      <td className="px-1.5 py-1 text-[10px] text-black-45">{l.pais || <span className="text-black-25">—</span>}</td>
                      <td className="px-1.5 py-1">
                        <span className="font-mono text-[9px] text-primary">{normalizeDomain(l.link_dominio || l.dominio) || <span className="text-black-25">—</span>}</span>
                      </td>
                      <td className="px-1.5 py-1"><EstadoLocalBadge estado={l.estado} /></td>
                      <td className="px-1.5 py-1 text-[9px] text-black-45">{l.plan || <span className="text-black-25">—</span>}</td>
                      <td className="px-1.5 py-1 text-right text-[9px] tabular-nums">
                        {data.actividadLocalLoading ? "…" : (actLocal?.total ?? 0)}
                      </td>
                      <td className="px-1.5 py-1 text-[9px] text-black-45">
                        {data.actividadLocalLoading ? "…" : actLocal?.ultima_atencion ? fmtFecha(actLocal.ultima_atencion) : <span className="text-black-25">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SeccionColapsable>

      {/* Drawers de locales */}
      {data.localesOpen && (
        <LocalesDrawer ficha={ficha} actividadPorDominio={data.actividadPorDominio} actividadLoading={data.actividadLoading} onClose={() => data.setLocalesOpen(false)} />
      )}
      {data.localSeleccionado && historiaLocalData && (
        <HistoriaLocalDrawer
          data={historiaLocalData}
          onVolver={() => data.setLocalSeleccionado(null)}
          onCerrar={() => data.setLocalSeleccionado(null)}
        />
      )}
      {data.localSeleccionado && historiaLocalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <p className="rounded bg-white px-4 py-2 text-[11px] text-black-45">Cargando Historia del Local…</p>
        </div>
      )}
    </div>
  );
}