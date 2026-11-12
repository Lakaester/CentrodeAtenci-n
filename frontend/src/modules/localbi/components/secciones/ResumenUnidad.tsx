import {
  SeccionColapsable,
  SegmentoBadge,
  EstadoLocalBadge,
  fmtMoneda,
  fmtFecha,
  nombreLocal,
  useHistoriaDensity,
} from "../HistoriaClinicaUI";
import { normalizeDomain } from "@/domain/normalizacion";
import { LocalesDrawer } from "../LocalesDrawer";
import { HistoriaLocalDrawer } from "../HistoriaLocalDrawer";
import { useHistoriaLocal } from "../../hooks/useHistoriaClinica";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { cn } from "@/lib/utils";

/** KPI del resumen. La variante comfortable solo se activa en /clientes. */
function Kpi({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "ok" | "warn" | "danger" | "plain";
  highlight?: boolean;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const cls = tone === "ok" ? "text-success" : tone === "warn" ? "text-warning-65" : tone === "danger" ? "text-danger" : "text-black-85";
  return (
    <div
      className={cn(
        "rounded-lg border border-black-10",
        comfortable ? "bg-white px-4 py-3" : "bg-light px-2 py-1.5",
        comfortable && highlight && "border-primary-25 bg-primary-5/40",
      )}
    >
      <p
        className={cn(
          "leading-tight",
          comfortable ? "text-[24px] font-bold tracking-tight" : "text-sm font-semibold",
          cls,
        )}
      >
        {value}
      </p>
      <p className={cn(comfortable ? "mt-1 text-[13px] font-medium text-black-65" : "mt-0.5 text-[9px] text-black-45")}>
        {label}
      </p>
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
export function ResumenUnidad({
  data,
  dominioSeleccionado,
  localSeleccionado,
  unidadNombre,
}: {
  data: HistoriaClinicaData;
  dominioSeleccionado?: string;
  localSeleccionado?: string;
  unidadNombre?: string;
}) {
  const { ficha, locales } = data;
  const comfortable = useHistoriaDensity() === "comfortable";
  const { data: historiaLocalData, isLoading: historiaLocalLoading } = useHistoriaLocal(
    ficha?.unidadnegocio_id ?? "",
    data.localSeleccionado,
  );

  if (!ficha) return null;

  const npsOculto = true; // NPS temporalmente oculto en el Panel Operativo.
  const dominioPrincipal =
    normalizeDomain(dominioSeleccionado || ficha.dominios?.[0]?.dominio || "") || "—";
  const badgeClass = comfortable
    ? "inline-flex items-center rounded-md bg-black-5 px-2 py-1 text-[12px] text-black-65"
    : "rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45";

  // Atenciones que la fuente no pudo vincular a un local. No se infiere local:
  // se conservan como actividad del dominio y se muestran por separado.
  const sinLocal = (ficha.dominios ?? []).map((d) => {
    const dominio = normalizeDomain(d.dominio) || d.dominio;
    const totalDominio = data.actividadPorDominio.get(dominio)?.resumen.total ?? 0;
    const asignado = (d.locales ?? []).reduce(
      (acc, l) => acc + (data.actividadLocalData?.[l.localbi_id]?.total ?? 0),
      0,
    );
    return { dominio, total: Math.max(0, totalDominio - asignado) };
  }).filter((r) => r.total > 0);

  return (
    <div className="space-y-0.5">
      {/* Cabecera del cliente */}
      <div className={cn("border-b border-black-10", comfortable ? "px-5 py-4" : "px-3 py-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className={cn(
                "truncate font-semibold text-black-85",
                comfortable ? "text-[20px] leading-tight" : "text-sm",
              )}
            >
              {unidadNombre || ficha.unidadnegocio_nombre || ficha.unidadnegocio_id}
            </h2>
            <div
              className={cn(
                "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1",
                comfortable ? "text-[13px] text-black-65" : "text-[10px] text-black-45",
              )}
            >
              <span
                className={cn(
                  "truncate font-mono text-primary",
                  comfortable ? "text-[14px]" : "text-[10px]",
                )}
                title={dominioPrincipal}
              >
                {dominioPrincipal}
              </span>
              <span className="truncate">Unidad: {ficha.unidadnegocio_id}</span>
              {localSeleccionado && <span className="truncate">Local: {localSeleccionado}</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {(data.refrescando || data.isFetching) && (
                <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
                  Actualizando…
                </span>
              )}
              <button
                type="button"
                onClick={() => data.refreshAll()}
                disabled={data.refrescando}
                className={cn(
                  "rounded-md border border-black-10 font-medium text-black-65 hover:border-primary-25 hover:bg-primary-5 hover:text-primary disabled:opacity-50",
                  comfortable ? "px-3 py-1.5 text-[13px]" : "px-1.5 py-0.5 text-[9px]",
                )}
              >
                Actualizar
              </button>
            </div>
            {data.erroresActualizacion.length > 0 && (
              <p className="max-w-[220px] text-right text-[11px] font-medium text-danger">
                No se pudo actualizar: {data.erroresActualizacion.join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center", comfortable ? "mt-3 gap-2" : "mt-1.5 gap-1.5")}>
          <SegmentoBadge segmento={ficha.segmento} />
          <span className={badgeClass}>Plan: {ficha.plan || "—"}</span>
          <span className={badgeClass}>KAM: {ficha.kam?.localbi_kam || "—"}</span>
          <span className={badgeClass}>Pago: {fmtMoneda(ficha.pago_mensual)}</span>
          <button
            type="button"
            onClick={() => data.setLocalesOpen(true)}
            disabled={locales.length === 0}
            className={cn(
              "rounded-md border border-primary-25 bg-primary-5 font-medium text-primary hover:bg-primary-10 disabled:opacity-40",
              comfortable ? "px-2.5 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
              locales.length === 0 && "text-black-25",
            )}
          >
            {locales.length} locales
          </button>
        </div>

        <p className={cn(comfortable ? "mt-3 text-[13px] text-black-65" : "mt-1 text-[10px] text-black-45")}>
          <span className="font-medium text-black-85">Estado:</span>{" "}
          {ficha.resumen?.activos ?? "—"} activos · {ficha.resumen?.inactivos ?? "—"} inactivos ·{" "}
          {ficha.resumen?.churn ?? "—"} churn · {ficha.resumen?.sin_implementar ?? "—"} sin implementación
        </p>
      </div>

      {/* Resumen KPIs */}
      <div className={cn("border-b border-black-10", comfortable ? "px-5 py-4" : "px-3 py-2.5")}>
        <p
          className={cn(
            "font-semibold uppercase tracking-wider text-black-45",
            comfortable ? "mb-3 text-[13px]" : "mb-1.5 text-[9px]",
          )}
        >
          Resumen
        </p>
        <div className={cn("grid", comfortable ? "grid-cols-2 gap-3 md:grid-cols-3" : "grid-cols-3 gap-1.5")}>
          <Kpi label="Activos" value={ficha.resumen?.activos ?? "—"} tone="ok" />
          <Kpi label="Inactivos" value={ficha.resumen?.inactivos ?? "—"} />
          <Kpi label="Churn" value={ficha.resumen?.churn ?? "—"} tone={ficha.resumen?.churn ? "danger" : "plain"} />
          <Kpi label="Sin implementación" value={ficha.resumen?.sin_implementar ?? "—"} tone="warn" />
          <Kpi label="Total" value={ficha.resumen?.total ?? "—"} highlight />
          <Kpi
            label="Aporte"
            value={ficha.resumen?.aporte_mensual_total != null ? fmtMoneda(ficha.resumen.aporte_mensual_total) : "—"}
            highlight
          />
          {!npsOculto && (
            <Kpi label="NPS" value={ficha.resumen?.nps?.promedio != null ? String(ficha.resumen.nps.promedio) : "—"} tone="plain" />
          )}
        </div>
      </div>

      {/* Dominios y locales */}
      <SeccionColapsable
        title="Dominios y locales"
        defaultOpen
        badge={
          locales.length ? (
            <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
              {locales.length} locales
            </span>
          ) : undefined
        }
      >
        {locales.length === 0 ? (
          <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
            Sin locales registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={cn("w-full border-collapse text-left", comfortable && "min-w-[860px]")}>
              <thead>
                <tr
                  className={cn(
                    "border-b border-black-10 bg-black-5 uppercase tracking-wider text-black-65",
                    comfortable ? "text-[13px]" : "text-[9px] text-black-45",
                  )}
                >
                  <th className={cn("font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>Local</th>
                  <th className={cn("font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>País</th>
                  <th className={cn("font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>Dominio</th>
                  <th className={cn("font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>Estado</th>
                  <th className={cn("font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>Plan</th>
                  <th className={cn("text-right font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>Atenc.</th>
                  <th className={cn("font-semibold", comfortable ? "px-3 py-3" : "px-1.5 py-1 font-medium")}>Últ. atención</th>
                </tr>
              </thead>
              <tbody>
                {locales.map((l) => {
                  const domNorm = normalizeDomain(l.link_dominio || l.dominio);
                  const nombreIncidencias = data.soporteData?.nombreLocalPorDominio?.[domNorm];
                  const actLocal = data.actividadLocalData?.[l.localbi_id];
                  return (
                    <tr
                      key={l.localbi_id}
                      onClick={() => data.setLocalSeleccionado(l.localbi_id)}
                      className={cn(
                        "cursor-pointer border-b border-black-10",
                        comfortable ? "hover:bg-primary-5" : "hover:bg-light",
                      )}
                      title="Ver Historia del Local"
                    >
                      <td className={cn("font-medium text-black-85", comfortable ? "px-3 py-3 text-[13px]" : "px-1.5 py-1 text-[10px]")}>
                        {nombreLocal(l, nombreIncidencias)}
                      </td>
                      <td className={cn("text-black-65", comfortable ? "px-3 py-3 text-[13px]" : "px-1.5 py-1 text-[10px] text-black-45")}>
                        {l.pais || <span className="text-black-45">—</span>}
                      </td>
                      <td className={comfortable ? "px-3 py-3" : "px-1.5 py-1"}>
                        <span
                          className={cn("font-mono text-primary", comfortable ? "text-[13px]" : "text-[9px]")}
                          title={normalizeDomain(l.link_dominio || l.dominio)}
                        >
                          {normalizeDomain(l.link_dominio || l.dominio) || <span className="text-black-45">—</span>}
                        </span>
                      </td>
                      <td className={comfortable ? "px-3 py-3" : "px-1.5 py-1"}>
                        <EstadoLocalBadge estado={l.estado} />
                      </td>
                      <td className={cn("text-black-65", comfortable ? "px-3 py-3 text-[13px]" : "px-1.5 py-1 text-[9px] text-black-45")}>
                        {l.plan || <span className="text-black-45">—</span>}
                      </td>
                      <td className={cn("text-right tabular-nums text-black-85", comfortable ? "px-3 py-3 text-[13px]" : "px-1.5 py-1 text-[9px]")}>
                        {data.actividadLocalLoading ? "…" : (actLocal?.total ?? 0)}
                      </td>
                      <td className={cn("text-black-65", comfortable ? "px-3 py-3 text-[13px]" : "px-1.5 py-1 text-[9px] text-black-45")}>
                        {data.actividadLocalLoading ? "…" : actLocal?.ultima_atencion ? fmtFecha(actLocal.ultima_atencion) : <span className="text-black-45">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {!data.actividadLocalLoading && !data.actividadLoading && sinLocal.map((r) => (
                  <tr
                    key={`sin-local-${r.dominio}`}
                    className={cn(
                      "border-b border-black-10 bg-warning-5/40",
                      comfortable ? "text-[13px]" : "text-[10px]",
                    )}
                    title="Atenciones del dominio sin localbi_id; no se infiere un local"
                  >
                    <td className={cn("font-medium text-warning-65", comfortable ? "px-3 py-3" : "px-1.5 py-1")}>
                      Sin local asignado
                    </td>
                    <td className={cn("text-black-45", comfortable ? "px-3 py-3" : "px-1.5 py-1")}>—</td>
                    <td className={comfortable ? "px-3 py-3" : "px-1.5 py-1"}>
                      <span className={cn("font-mono text-primary", comfortable ? "text-[13px]" : "text-[9px]")}>
                        {r.dominio}
                      </span>
                    </td>
                    <td className={comfortable ? "px-3 py-3" : "px-1.5 py-1"}>
                      <span className={cn("inline-flex items-center rounded-md bg-warning-10 font-medium text-warning-65", comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]")}>
                        Sin asignar
                      </span>
                    </td>
                    <td className={cn("text-black-45", comfortable ? "px-3 py-3" : "px-1.5 py-1")}>—</td>
                    <td className={cn("text-right font-medium tabular-nums text-black-85", comfortable ? "px-3 py-3" : "px-1.5 py-1 text-[9px]")}>
                      {r.total}
                    </td>
                    <td className={cn("text-black-45", comfortable ? "px-3 py-3" : "px-1.5 py-1")}>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.actividadLocalLoading && !data.actividadLoading && sinLocal.length > 0 && (
              <p className={cn("mt-2 text-black-65", comfortable ? "text-[12px]" : "text-[10px] text-black-45")}>
                Las atenciones sin local asignado se conservan como actividad del dominio. No se
                infiere ni se inventa un local.
              </p>
            )}
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