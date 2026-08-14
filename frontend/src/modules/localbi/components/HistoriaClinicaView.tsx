import { useHistoriaClinica } from "../hooks/useHistoriaClinica";
import type { LocalbiHistoriaClinica } from "../types/localbi";
import { SeccionColapsable, Info, ND, SegmentoBadge, EstadoLocalBadge, fmtMoneda, fmtFecha } from "./HistoriaClinicaUI";
import { HistorialFacturacion } from "@/modules/facturacion/components/HistorialFacturacion";
import { QdClienteHistorial } from "@/modules/quejas-devoluciones/components/QdClienteHistorial";
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

export function HistoriaClinicaView({ unidadNegocio }: { unidadNegocio: string }) {
  const { data, isLoading, isFetching, refetch } = useHistoriaClinica(unidadNegocio);

  if (isLoading) {
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

  if (!data) {
    return <div className="p-3 text-[10px] text-black-25">No se pudo cargar la Historia Clínica.</div>;
  }

  if (data.status === "not_configured") {
    return (
      <div className="flex flex-col items-center p-6 text-center">
        <p className="text-[11px] font-semibold text-warning-65">Historia del cliente no disponible</p>
        <p className="mt-1 max-w-xs text-[10px] text-black-45">{data.mensaje}</p>
        <button type="button" onClick={() => refetch()} className="mt-3 rounded bg-primary px-3 py-1.5 text-[10px] font-medium text-white hover:bg-primary-85">
          Reintentar
        </button>
      </div>
    );
  }

  if (data.status === "unavailable") {
    return (
      <div className="flex flex-col items-center p-6 text-center">
        <p className="text-[11px] font-semibold text-danger">Historia del cliente no disponible</p>
        <p className="mt-1 max-w-xs text-[10px] text-black-45">{data.mensaje}</p>
        <button type="button" onClick={() => refetch()} className="mt-3 rounded bg-primary px-3 py-1.5 text-[10px] font-medium text-white hover:bg-primary-85">
          Reintentar
        </button>
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="flex flex-col items-center p-6 text-center">
        <p className="text-[11px] font-semibold text-danger">Error al cargar la Historia del cliente</p>
        <p className="mt-1 max-w-xs text-[10px] text-black-45">{data.mensajes?.join(" · ")}</p>
        <button type="button" onClick={() => refetch()} className="mt-3 rounded bg-primary px-3 py-1.5 text-[10px] font-medium text-white hover:bg-primary-85">
          Reintentar
        </button>
      </div>
    );
  }

  const ficha = data.data as LocalbiHistoriaClinica;
  const locales = ficha.dominios.flatMap((d) => d.locales.map((l) => ({ ...l, dominio: d.dominio })));
  const tickets = locales.flatMap((l) => l.tickets);
  const tareasSueltas = locales.flatMap((l) => l.tareas_sueltas ?? []);
  const npsResumen = ficha.resumen?.nps;

  return (
    <div>
      {data.warnings?.length > 0 && (
        <div className="mb-1 px-2.5 py-1 text-[9px] text-warning-65">{data.warnings.join(" · ")}</div>
      )}

      {/* Cabecera del cliente */}
      <div className="border-b border-black-10 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold text-black-85">{ficha.unidadnegocio_nombre || ficha.unidadnegocio_id}</h2>
          <div className="flex shrink-0 items-center gap-1.5">
            {isFetching && <span className="text-[9px] text-black-25">Actualizando…</span>}
            <button type="button" onClick={() => refetch()} className="rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-black-45 hover:bg-light">
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
        </div>
      </div>

      {/* Resumen KPIs compactos */}
      <div className="border-b border-black-10 px-3 py-2.5">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-black-45">Resumen</p>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          <Kpi label="Activos" value={ficha.resumen?.activos ?? "—"} tone="ok" />
          <Kpi label="Inactivos" value={ficha.resumen?.inactivos ?? "—"} />
          <Kpi label="Churn" value={ficha.resumen?.churn ?? "—"} tone={ficha.resumen?.churn ? "danger" : "plain"} />
          <Kpi label="Sin impl." value={ficha.resumen?.sin_implementar ?? "—"} tone="warn" />
          <Kpi label="Total" value={ficha.resumen?.total ?? "—"} />
          <Kpi label="Aporte" value={ficha.resumen?.aporte_mensual_total != null ? fmtMoneda(ficha.resumen.aporte_mensual_total) : "—"} />
          <Kpi label="NPS" value={fmtNps(npsResumen?.promedio)} tone={fmtNpsTone(npsResumen?.promedio)} />
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
                  <th className="px-1.5 py-1 text-right font-medium">Mód.</th>
                </tr>
              </thead>
              <tbody>
                {locales.map((l) => (
                  <tr key={l.localbi_id} className="border-b border-black-5">
                    <td className="px-1.5 py-1 text-[10px] font-medium text-black-85">{l.nombre || <ND />}</td>
                    <td className="px-1.5 py-1 text-[10px] text-black-45">{l.pais || <ND />}</td>
                    <td className="px-1.5 py-1">
                      <span className="font-mono text-[9px] text-primary">{l.link_dominio || l.dominio || <ND />}</span>
                    </td>
                    <td className="px-1.5 py-1"><EstadoLocalBadge estado={l.estado} /></td>
                    <td className="px-1.5 py-1 text-[9px] text-black-45">{l.plan || <ND />}</td>
                    <td className="px-1.5 py-1 text-right text-[9px] text-black-45">{l.cantidadmodulosusa ?? 0}/9</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SeccionColapsable>

      {/* Módulos */}
      <SeccionColapsable title="Módulos utilizados">
        {locales.length === 0 ? (
          <p className="text-[10px] text-black-25">Sin información</p>
        ) : (
          <div className="space-y-0.5">
            {locales.map((l) => (
              <div key={l.localbi_id} className="flex items-center justify-between py-0.5">
                <span className="truncate text-[10px] text-black-85">{l.nombre || l.localbi_id}</span>
                <span className="ml-2 shrink-0 text-[9px] text-black-45">
                  {l.cantidadmodulosusa ?? 0} módulos · {l.porcentajemodulousa != null ? `${Math.round(l.porcentajemodulousa)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SeccionColapsable>

      {/* Tickets de desarrollo */}
      <SeccionColapsable title="Tickets" badge={tickets.length ? <span className="text-[9px] text-black-45">{tickets.length}</span> : undefined}>
        {tickets.length === 0 ? (
          <p className="text-[10px] text-black-25">Sin tickets registrados</p>
        ) : (
          <div className="space-y-1">
            {tickets.map((t) => (
              <div key={t.ticket_id} className="rounded border border-black-10 bg-light p-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9px] font-semibold text-primary">#{t.ticket_id}</span>
                  <span className="truncate text-[10px] font-medium text-black-85">{t.titulo || "—"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-black-45">
                  <span>{t.tipo || "—"}</span>
                  <span>{t.subcategoria || "—"}</span>
                  <span>{t.estado || "—"}</span>
                  <span>{fmtFecha(t.fecha_creacion)}</span>
                  {t.area_responsable && <span>· {t.area_responsable}</span>}
                </div>
                {t.tareas?.length > 0 && (
                  <div className="mt-1 border-t border-black-10 pt-1">
                    <p className="mb-0.5 text-[8px] font-medium uppercase tracking-wider text-black-25">Tareas</p>
                    {t.tareas.map((ta) => (
                      <div key={ta.tarea_id} className="flex items-center justify-between gap-2 py-0.5">
                        <span className="truncate text-[9px] text-black-85">{ta.titulo || "—"}</span>
                        <span className="shrink-0 text-[8px] text-black-45">{ta.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SeccionColapsable>

      {/* Tareas sueltas */}
      <SeccionColapsable title="Tareas" badge={tareasSueltas.length ? <span className="text-[9px] text-black-45">{tareasSueltas.length}</span> : undefined}>
        {tareasSueltas.length === 0 ? (
          <p className="text-[10px] text-black-25">Sin tareas registradas</p>
        ) : (
          <div className="space-y-0.5">
            {tareasSueltas.map((ta) => (
              <div key={ta.tarea_id} className="flex items-center justify-between gap-2 py-0.5">
                <span className="truncate text-[10px] text-black-85">{ta.titulo || "—"}</span>
                <span className="shrink-0 text-[9px] text-black-45">{ta.estado}</span>
              </div>
            ))}
          </div>
        )}
      </SeccionColapsable>

      {/* NPS */}
      <SeccionColapsable title="NPS">
        <Info label="Locales con NPS">{npsResumen?.locales_con_nps ?? <ND />}</Info>
        <Info label="Promedio">{fmtNps(npsResumen?.promedio)}</Info>
        <Info label="Promedio producto">{fmtNps(npsResumen?.promedio_producto)}</Info>
      </SeccionColapsable>

      {/* Historial de facturación (solo lectura) */}
      <SeccionColapsable title="Historial de facturación">
        <HistorialFacturacion
          unidadNegocioId={ficha.unidadnegocio_id ?? null}
          dominios={ficha.dominios.map((d) => d.dominio)}
        />
      </SeccionColapsable>

      <SeccionColapsable title="Quejas y devoluciones">
        <QdClienteHistorial dominios={ficha.dominios.map((d) => d.dominio)} />
      </SeccionColapsable>
    </div>
  );
}

/** Valor NPS con "—" para null/vacío. */
function fmtNps(v: number | null | undefined): React.ReactNode {
  return v != null ? String(v) : <ND />;
}

/** Tono semántico del NPS (solo presentación; no modifica el valor). */
function fmtNpsTone(v: number | null | undefined): "ok" | "warn" | "danger" | "plain" {
  if (v == null) return "plain";
  if (v >= 7) return "ok";
  if (v >= 4) return "warn";
  return "danger";
}
