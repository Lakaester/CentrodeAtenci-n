import { useState } from "react";
import { useHistoriaClinica, useActividadCliente, useSoporteOnline, useHistoriaLocal, useActividadLocal } from "../hooks/useHistoriaClinica";
import type { LocalbiHistoriaClinica, ActividadDominio, SoporteOnlineResult } from "../types/localbi";
import { SeccionColapsable, Info, ND, SegmentoBadge, EstadoLocalBadge, fmtMoneda, fmtFecha, nombreLocal, normalizarDominio } from "./HistoriaClinicaUI";
import { LocalesDrawer } from "./LocalesDrawer";
import { HistoriaLocalDrawer } from "./HistoriaLocalDrawer";
import { HistorialFacturacion } from "@/modules/facturacion/components/HistorialFacturacion";
import { QdClienteHistorial } from "@/modules/quejas-devoluciones/components/QdClienteHistorial";
import { useTareabiLogs } from "@/modules/tareabi";
import type { TareabiTareaLog } from "@/modules/tareabi";
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
  const [localesOpen, setLocalesOpen] = useState(false);
  const [localSeleccionado, setLocalSeleccionado] = useState<string | null>(null);

  // Hooks siempre en orden: actividad de COPE para los dominios de la ficha (si ya cargó).
  const fichaData = data?.status === "success" || data?.status === "warning" ? (data.data as LocalbiHistoriaClinica) : null;
  const dominiosDeLaFicha = fichaData?.dominios?.map((d) => d.dominio) ?? [];
  const localbiIdsDeLaFicha = fichaData?.dominios?.flatMap((d) => (d.locales ?? []).map((l) => l.localbi_id)) ?? [];
  const { data: actividadData, isLoading: actividadLoading } = useActividadCliente(dominiosDeLaFicha);
  const [periodoInc, setPeriodoInc] = useState<string>("90");
  const { data: soporteData, isLoading: soporteLoading } = useSoporteOnline(dominiosDeLaFicha, periodoInc);
  const { data: historiaLocalData, isLoading: historiaLocalLoading } = useHistoriaLocal(unidadNegocio, localSeleccionado);
  const { data: actividadLocalData, isLoading: actividadLocalLoading } = useActividadLocal(localbiIdsDeLaFicha);

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
        <p className="text-[11px] font-semibold text-warning-65">Historia del cliente no disponible: falta configurar la credencial de LocalBI.</p>
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

  // Mapa dominio → actividad de COPE (v_unificado_norm).
  const actividadPorDominio = new Map<string, ActividadDominio>((actividadData ?? []).map((a) => [a.dominio, a]));
  const actividadTotal = (actividadData ?? []).reduce((acc, a) => acc + a.resumen.total, 0);
  const actividadCanales = new Map<string, number>();
  for (const a of actividadData ?? []) {
    for (const c of a.resumen.canales) actividadCanales.set(c.nombre, (actividadCanales.get(c.nombre) ?? 0) + c.cantidad);
  }
  const actividadOrdenada = [...actividadCanales.entries()].sort((x, y) => y[1] - x[1]);

  // Soporte en Línea (incidencias).
  const soporteTotal = soporteData?.totalIncidencias ?? 0;
  const soporteAbiertas = (soporteData?.porDominio ?? []).reduce((acc, d) => acc + d.resumen.abiertas, 0);
  const soporteCategorias = new Map<string, number>();
  for (const d of soporteData?.porDominio ?? []) {
    for (const c of d.resumen.categorias) soporteCategorias.set(c.nombre, (soporteCategorias.get(c.nombre) ?? 0) + c.cantidad);
  }
  const soporteCategoriasOrdenadas = [...soporteCategorias.entries()].sort((x, y) => y[1] - x[1]);
  const soportePromEspera = (() => {
    const con = (soporteData?.porDominio ?? []).filter((d) => d.resumen.prom_espera_min != null);
    return con.length ? Math.round(con.reduce((a, d) => a + (d.resumen.prom_espera_min ?? 0), 0) / con.length) : null;
  })();
  const soportePromSolucion = (() => {
    const con = (soporteData?.porDominio ?? []).filter((d) => d.resumen.prom_solucion_min != null);
    return con.length ? Math.round(con.reduce((a, d) => a + (d.resumen.prom_solucion_min ?? 0), 0) / con.length) : null;
  })();

  // Historial Transversal: incidencias + actividad COPE + tickets, ordenado por fecha.
  const eventosTransversales = (() => {
    const eventos: { fecha: string; area: string; titulo: string; detalle: string | null; estado: string | null }[] = [];

    // Soporte en Línea (incidencias)
    for (const d of soporteData?.porDominio ?? []) {
      for (const inc of d.ultimasIncidencias) {
        eventos.push({
          fecha: inc.ticket_timestamp,
          area: "Soporte en Línea",
          titulo: inc.tipoproblema || "Incidencia",
          detalle: inc.descripcion || null,
          estado: inc.estado,
        });
      }
    }

    // Actividad COPE (atenciones v_unificado)
    for (const a of actividadData ?? []) {
      for (const at of a.ultimasAtenciones) {
        eventos.push({
          fecha: at.fecha,
          area: "Soporte Especializado",
          titulo: at.categoria || at.subcategoria || "Atención",
          detalle: at.subcategoria || at.contacto || null,
          estado: at.estado,
        });
      }
    }

    // Desarrollo (tickets LocalBI)
    for (const t of tickets) {
      eventos.push({
        fecha: t.fecha_creacion,
        area: "Desarrollo",
        titulo: t.titulo || `Ticket #${t.ticket_id}`,
        detalle: t.subcategoria || null,
        estado: t.estado,
      });
    }

    return eventos
      .filter((e) => e.fecha)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 40);
  })();

  return (
    <>
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
          <button type="button" onClick={() => setLocalesOpen(true)} disabled={locales.length === 0}
            className={cn("rounded border px-1.5 py-0.5 text-[9px] text-primary hover:bg-primary-5 disabled:opacity-40", locales.length === 0 && "text-black-25")}>
            {locales.length} locales
          </button>
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
                  <th className="px-1.5 py-1 text-right font-medium">Atenc.</th>
                  <th className="px-1.5 py-1 font-medium">Últ. atención</th>
                  <th className="px-1.5 py-1 text-right font-medium">NPS</th>
                </tr>
              </thead>
              <tbody>
                {locales.map((l) => {
                  const domNorm = normalizarDominio(l.link_dominio || l.dominio);
                  const nombreIncidencias = soporteData?.nombreLocalPorDominio?.[domNorm];
                  const actLocal = actividadLocalData?.[l.localbi_id];
                  return (
                    <tr key={l.localbi_id} onClick={() => setLocalSeleccionado(l.localbi_id)}
                      className="cursor-pointer border-b border-black-5 hover:bg-light" title="Ver Historia del Local">
                      <td className="px-1.5 py-1 text-[10px] font-medium text-black-85">
                        {nombreLocal(l, nombreIncidencias)}
                      </td>
                      <td className="px-1.5 py-1 text-[10px] text-black-45">{l.pais || <ND />}</td>
                      <td className="px-1.5 py-1">
                        <span className="font-mono text-[9px] text-primary">{l.link_dominio || l.dominio || <ND />}</span>
                      </td>
                      <td className="px-1.5 py-1"><EstadoLocalBadge estado={l.estado} /></td>
                      <td className="px-1.5 py-1 text-[9px] text-black-45">{l.plan || <ND />}</td>
                      <td className="px-1.5 py-1 text-right text-[9px] tabular-nums">
                        {actividadLocalLoading ? "…" : (actLocal?.total ?? 0)}
                      </td>
                      <td className="px-1.5 py-1 text-[9px] text-black-45">
                        {actividadLocalLoading ? "…" : actLocal?.ultima_atencion ? fmtFecha(actLocal.ultima_atencion) : <span className="text-black-25">—</span>}
                      </td>
                      <td className="px-1.5 py-1 text-right text-[9px] tabular-nums">
                        {l.nps?.llamadabi_nps != null ? l.nps.llamadabi_nps : <span className="text-black-25">—</span>}
                      </td>
                    </tr>
                  );
                })}
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
          <div className="space-y-1">
            {locales.map((l) => {
              const pct = l.cantidadmodulosusa != null ? Math.min(100, (l.cantidadmodulosusa / 9) * 100) : 0;
              return (
                <div key={l.localbi_id} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="min-w-0 flex-1 truncate text-[10px] text-black-85">{l.nombre || l.localbi_id}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded bg-black-5">
                      <div className="bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-14 text-right text-[9px] text-black-45 tabular-nums">
                      {l.cantidadmodulosusa ?? 0}/9 · {l.porcentajemodulousa != null ? `${Math.round(l.porcentajemodulousa)}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SeccionColapsable>

      {/* Addons (preparado — sin fuente real aún) */}
      <SeccionColapsable title="Addons">
        <p className="text-[10px] text-black-25">Sin información disponible. Pendiente de fuente LocalBI de addons.</p>
      </SeccionColapsable>

      {/* Integraciones (preparado — sin fuente real aún) */}
      <SeccionColapsable title="Integraciones">
        <p className="text-[10px] text-black-25">Sin información disponible. Pendiente de fuente LocalBI de integraciones.</p>
      </SeccionColapsable>

      {/* Tickets de desarrollo */}
      <SeccionColapsable title="Tickets" badge={tickets.length ? <span className="text-[9px] text-black-45">{tickets.length}</span> : undefined}>
        {tickets.length === 0 ? (
          <p className="text-[10px] text-black-25">Sin tickets registrados</p>
        ) : (
          <div className="space-y-1">
            {tickets.map((t) => (
              <TicketExpandible key={t.ticket_id} ticket={t} />
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

      {/* Actividad en COPE (v_unificado_norm) */}
      <SeccionColapsable title={`Actividad en COPE`} badge={
        <span className="text-[9px] text-black-45">{actividadLoading ? "…" : `${actividadTotal} atenciones`}</span>
      }>
        {actividadLoading ? (
          <p className="text-[10px] text-black-25">Cargando actividad…</p>
        ) : actividadTotal === 0 ? (
          <p className="text-[10px] text-black-25">Sin atenciones registradas</p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-wider text-black-45">Canales:</span>
              {actividadOrdenada.map(([canal, n]) => (
                <span key={canal} className="rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary">{canal} · {n}</span>
              ))}
            </div>
            <div className="space-y-1">
              {actividadData?.map((a) => {
                const l = locales.find((x) => x.link_dominio === a.dominio || x.dominio === a.dominio);
                return (
                  <div key={a.dominio} className="rounded border border-black-5 bg-light p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[10px] font-medium text-black-85">{l?.nombre || a.dominio}</span>
                      <span className="shrink-0 font-mono text-[9px] text-primary">{a.dominio}</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-black-45">
                      {a.resumen.total} atenciones
                      {a.resumen.ultima_atencion && <> · últ. {fmtFecha(a.resumen.ultima_atencion)}</>}
                      {a.resumen.asesores[0] && <> · {a.resumen.asesores[0].nombre}</>}
                    </p>
                    {a.ultimasAtenciones.length > 0 && (
                      <div className="mt-1 space-y-0.5 border-t border-black-10 pt-1">
                        {a.ultimasAtenciones.slice(0, 4).map((at, i) => (
                          <div key={i} className="flex flex-wrap items-center gap-x-2 text-[8px] text-black-45">
                            <span className="shrink-0 tabular-nums">{fmtFecha(at.fecha)}</span>
                            <span className="shrink-0 rounded bg-black-5 px-1 font-medium text-black-65">{at.canal}</span>
                            {at.categoria && <span className="truncate">{at.categoria}</span>}
                            {at.subcategoria && <span className="truncate text-black-25">· {at.subcategoria}</span>}
                            {at.asesor && <span className="shrink-0">· {at.asesor}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SeccionColapsable>

      {/* Soporte en Línea (public.incidencias) */}
      <SeccionColapsable title={`Soporte en Línea`} badge={
        <span className="flex items-center gap-1.5">
          <span className="text-[9px] text-black-45">{soporteLoading ? "…" : `${soporteTotal} incidencias`}</span>
        </span>
      }>
        <div className="space-y-2">
          {/* Selector de período */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-black-45">Período:</span>
            {[["7", "7d"], ["30", "30d"], ["90", "90d"], ["todo", "Todo"]].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setPeriodoInc(v)}
                className={cn("rounded px-2 py-0.5 text-[9px] font-medium", periodoInc === v ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}>
                {label}
              </button>
            ))}
          </div>

          {soporteLoading ? (
            <p className="text-[10px] text-black-25">Cargando incidencias…</p>
          ) : soporteTotal === 0 ? (
            <p className="text-[10px] text-black-25">Sin incidencias registradas</p>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <SoporteKpi label="Total" value={String(soporteTotal)} />
                <SoporteKpi label="Abiertas" value={String(soporteAbiertas)} tone={soporteAbiertas > 0 ? "warn" : "plain"} />
                <SoporteKpi label="Cerradas" value={String(soporteTotal - soporteAbiertas)} />
                <SoporteKpi label="Prom. espera" value={soportePromEspera != null ? `${soportePromEspera} min` : "—"} />
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <SoporteKpi label="Prom. solución" value={soportePromSolucion != null ? `${soportePromSolucion} min` : "—"} />
                <SoporteKpi label="Última incidencia" value={ultimaSoporte(soporteData)} wide />
                <SoporteKpi label="Primera incidencia" value={primeraSoporte(soporteData)} wide />
              </div>

              {/* Categorías */}
              {soporteCategoriasOrdenadas.length > 0 && (
                <div>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Por categoría</p>
                  <div className="flex flex-wrap gap-1.5">
                    {soporteCategoriasOrdenadas.slice(0, 8).map(([cat, n]) => (
                      <span key={cat} className="rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary">{cat} · {n}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Distribución por local */}
              {soporteData?.porDominio.some((d) => d.resumen.porLocal.length > 0) && (
                <div>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Por local</p>
                  <div className="flex flex-wrap gap-1.5">
                    {soporteData.porDominio.flatMap((d) => d.resumen.porLocal.map((l) => ({ ...l, dominio: d.dominio }))).map((l, i) => (
                      <span key={i} className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-65">{l.nombre} · {l.cantidad}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Últimas incidencias */}
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Últimas incidencias</p>
                <div className="space-y-1">
                  {soporteData?.porDominio.flatMap((d) => d.ultimasIncidencias.slice(0, 3).map((inc) => ({ ...inc, dominio: d.dominio })))
                    .sort((a, b) => new Date(b.ticket_timestamp).getTime() - new Date(a.ticket_timestamp).getTime())
                    .slice(0, 5)
                    .map((inc, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-x-2 rounded border border-black-5 bg-light px-2 py-1 text-[8px] text-black-45">
                        <span className="shrink-0 tabular-nums">{fmtFecha(inc.ticket_timestamp)}</span>
                        <span className="shrink-0 rounded bg-black-5 px-1 font-medium text-black-65">{inc.tipoproblema || "—"}</span>
                        <span className="shrink-0">{inc.estado}</span>
                        <span className="shrink-0 text-black-25">{inc.local_nombre}</span>
                        {inc.asesor_nombre && <span className="shrink-0">· {inc.asesor_nombre}</span>}
                        {inc.descripcion && <span className="min-w-0 truncate">{inc.descripcion}</span>}
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
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

      {/* Historial Transversal (todas las interacciones ordenadas por fecha) */}
      <SeccionColapsable title={`Historial Transversal`} badge={
        <span className="text-[9px] text-black-45">{eventosTransversales.length} eventos</span>
      }>
        {eventosTransversales.length === 0 ? (
          <p className="text-[10px] text-black-25">Sin eventos registrados.</p>
        ) : (
          <div className="space-y-1.5">
            {eventosTransversales.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 border-b border-black-5 py-1 last:border-0">
                <span className="w-[68px] shrink-0 text-[9px] tabular-nums text-black-45">{fmtFecha(ev.fecha)}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-medium", tonoArea(ev.area))}>{ev.area}</span>
                    <span className="text-[9px] font-medium text-black-85">{ev.titulo}</span>
                    {ev.estado && <EstadoTareaBadge estado={ev.estado} />}
                  </div>
                  {ev.detalle && <p className="mt-0.5 line-clamp-2 text-[9px] text-black-45">{ev.detalle}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SeccionColapsable>
      </div>

      {localesOpen && <LocalesDrawer ficha={ficha} actividadPorDominio={actividadPorDominio} actividadLoading={actividadLoading} onClose={() => setLocalesOpen(false)} />}
      {localSeleccionado && historiaLocalData && (
        <HistoriaLocalDrawer
          data={historiaLocalData}
          onVolver={() => setLocalSeleccionado(null)}
          onCerrar={() => setLocalSeleccionado(null)}
        />
      )}
      {localSeleccionado && historiaLocalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <p className="rounded bg-white px-4 py-2 text-[11px] text-black-45">Cargando Historia del Local…</p>
        </div>
      )}
    </>
  );
}

/** Valor NPS con "—" para null/vacío. */
function fmtNps(v: number | null | undefined): React.ReactNode {
  return v != null ? String(v) : <ND />;
}
function fmtNpsTone(v: number | null | undefined): "ok" | "warn" | "danger" | "plain" {
  if (v == null) return "plain";
  if (v >= 7) return "ok";
  if (v >= 4) return "warn";
  return "danger";
}

/** Tono semántico del estado de una tarea/ticket (presentación). */
function tonoEstadoTarea(estado: string | null | undefined): string {
  const e = (estado ?? "").toLowerCase();
  if (/rechaz/.test(e)) return "bg-danger-5 text-danger";
  if (/complet|hecho|resuelt|cerrad/.test(e)) return "bg-success-5 text-success";
  if (/proceso|curso|prueba/.test(e)) return "bg-primary-5 text-primary";
  return "bg-black-5 text-black-45";
}

/** Badge de estado de ticket/tarea. */
function EstadoTareaBadge({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <ND />;
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", tonoEstadoTarea(estado))}>{estado}</span>;
}

interface TicketLocal {
  ticket_id: string;
  localbi_id: string;
  link_dominio: string;
  tipo: string;
  subcategoria: string;
  titulo: string;
  estado: string;
  fecha_creacion: string;
  area_responsable: string;
  tareas?: Array<{ tarea_id: string; titulo: string; estado: string; responsable: string; conclusion: string }>;
}

/** Ticket expandible que carga logs de Tareabi bajo demanda. */
function TicketExpandible({ ticket }: { ticket: TicketLocal }) {
  const [abierto, setAbierto] = useState(false);
  const primeraTareaId = ticket.tareas?.[0]?.tarea_id ?? null;
  const { data: logs, isLoading } = useTareabiLogs(abierto ? primeraTareaId : null, abierto ? ticket.ticket_id : null);

  const estadoTicket = abierto && logs ? logs.ticket_estado_actual ?? ticket.estado : ticket.estado;
  const tareas: TareabiTareaLog[] = abierto && logs ? logs.tareas : [];

  return (
    <div className="rounded border border-black-10 bg-light p-1.5">
      <button type="button" onClick={() => setAbierto((v) => !v)} className="flex w-full items-center gap-2 text-left">
        <span className="font-mono text-[9px] font-semibold text-primary">#{ticket.ticket_id}</span>
        <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-black-85">{ticket.titulo || "—"}</span>
        <EstadoTareaBadge estado={estadoTicket} />
      </button>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-black-45">
        <span>{ticket.tipo || "—"}</span>
        <span>{ticket.subcategoria || "—"}</span>
        <span>{fmtFecha(ticket.fecha_creacion)}</span>
        {ticket.area_responsable && <span>· {ticket.area_responsable}</span>}
        {!abierto && <button type="button" onClick={() => setAbierto(true)} className="text-primary underline">Ver detalle</button>}
      </div>

      {abierto && (
        <div className="mt-1.5 border-t border-black-10 pt-1.5">
          {!primeraTareaId ? (
            <p className="text-[9px] text-black-25">Sin tareas asociadas para consultar estado/comentario.</p>
          ) : isLoading ? (
            <p className="text-[9px] text-black-25">Consultando estado y comentarios…</p>
          ) : !logs ? (
            <p className="text-[9px] text-black-25">No se pudo consultar el detalle de Tareabi.</p>
          ) : (
            <div className="space-y-2">
              {logs.ticket_estado_actual && (
                <div className="flex items-center gap-1.5 text-[9px] text-black-45">
                  <span>Estado del ticket:</span><EstadoTareaBadge estado={logs.ticket_estado_actual} />
                </div>
              )}
              {tareas.length === 0 && (
                <p className="text-[9px] text-black-25">Sin tareas con historial.</p>
              )}
              {tareas.map((t) => (
                <div key={t.tareabi_id} className="rounded border border-black-5 bg-white p-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] text-primary">#{t.tareabi_id}</span>
                    <EstadoTareaBadge estado={t.tarea_estado} />
                  </div>
                  {t.tarea_comentario && (
                    <p className="mt-1 whitespace-pre-line text-[9px] text-black-65">{t.tarea_comentario}</p>
                  )}
                  {t.historial.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 border-t border-black-5 pt-1">
                      <p className="text-[8px] font-medium uppercase tracking-wider text-black-25">Historial</p>
                      {t.historial.map((h, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-x-2 text-[8px] text-black-45">
                          <span className="shrink-0 tabular-nums">{fmtFecha(h.fecha)}</span>
                          {h.persona && <span className="shrink-0 font-medium text-black-65">{h.persona}</span>}
                          {h.cambios.map((c, j) => (
                            <span key={j} className="rounded bg-black-5 px-1 text-[8px] text-black-45">
                              {c.campo}: {c.anterior || "—"} → {c.nuevo || "—"}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** KPI compacto para Soporte en Línea. */
function SoporteKpi({ label, value, tone, wide }: { label: string; value: React.ReactNode; tone?: "warn" | "plain"; wide?: boolean }) {
  const cls = tone === "warn" ? "text-warning-65" : "text-black-85";
  return (
    <div className={cn("rounded border border-black-10 bg-light px-2 py-1.5", wide && "col-span-2")}>
      <p className={cn("text-sm font-semibold leading-tight", cls)}>{value}</p>
      <p className="mt-0.5 text-[9px] text-black-45">{label}</p>
    </div>
  );
}

/** Última incidencia entre todos los dominios. */
function ultimaSoporte(data: SoporteOnlineResult | undefined): React.ReactNode {
  const todas = (data?.porDominio ?? []).flatMap((d) => d.ultimasIncidencias.map((i) => i.ticket_timestamp)).filter(Boolean);
  if (!todas.length) return "—";
  return fmtFecha(todas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]);
}

/** Primera incidencia entre todos los dominios. */
function primeraSoporte(data: SoporteOnlineResult | undefined): React.ReactNode {
  const todas = (data?.porDominio ?? []).flatMap((d) => d.ultimasIncidencias.map((i) => i.ticket_timestamp)).filter(Boolean);
  if (!todas.length) return "—";
  return fmtFecha(todas.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]);
}

/** Tono visual por área del historial transversal. */
function tonoArea(area: string): string {
  if (/Soporte en Línea/.test(area)) return "bg-primary-5 text-primary";
  if (/Especializado/.test(area)) return "bg-purple-5 text-purple";
  if (/Desarrollo/.test(area)) return "bg-aqua-5 text-aqua";
  if (/Facturación/.test(area)) return "bg-warning-5 text-warning-65";
  return "bg-black-5 text-black-45";
}
