import { useState } from "react";
import { SeccionColapsable, ND, fmtFecha } from "../HistoriaClinicaUI";
import { useTareabiLogs } from "@/modules/tareabi";
import type { TareabiTareaLog } from "@/modules/tareabi";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { cn } from "@/lib/utils";

/**
 * Sección ACTIVIDAD del Panel Operativo.
 *
 * Responde: "¿Qué actividad tiene o ha tenido este cliente/unidad?"
 *
 * Incluye:
 *   - Tickets (de desarrollo LocalBI, con logs de Tareabi bajo demanda).
 *   - Tareas sueltas.
 *   - Actividad en COPE (atenciones v_unificado_norm).
 *   - Módulos utilizados.
 *   - Soporte en Línea (incidencias).
 *
 * NPS y facturación NO viven aquí (NPS oculto; facturación → Operación).
 */
export function ActividadUnidad({ data }: { data: HistoriaClinicaData }) {
  const { locales, tickets, tareasSueltas } = data;

  return (
    <div className="space-y-0.5">
      {/* Tickets de desarrollo */}
      <SeccionColapsable title="Tickets" defaultOpen badge={tickets.length ? <span className="text-[9px] text-black-45">{tickets.length}</span> : undefined}>
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

      {/* Actividad en COPE (v_unificado_norm) */}
      <ActividadCope data={data} />

      {/* Módulos utilizados */}
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

      {/* Soporte en Línea (public.incidencias) */}
      <SoporteEnLinea data={data} />
    </div>
  );
}

function ActividadCope({ data }: { data: HistoriaClinicaData }) {
  return (
    <SeccionColapsable title={`Actividad en COPE`} badge={
      <span className="text-[9px] text-black-45">{data.actividadLoading ? "…" : `${data.actividadTotal} atenciones`}</span>
    }>
      {data.actividadLoading ? (
        <p className="text-[10px] text-black-25">Cargando actividad…</p>
      ) : data.actividadTotal === 0 ? (
        <p className="text-[10px] text-black-25">Sin atenciones registradas</p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-black-45">Canales:</span>
            {data.actividadOrdenada.map(([canal, n]) => (
              <span key={canal} className="rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary">{canal} · {n}</span>
            ))}
          </div>
          <div className="space-y-1">
            {data.actividadData?.map((a) => {
              const l = data.locales.find((x) => x.link_dominio === a.dominio || x.dominio === a.dominio);
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
  );
}

function SoporteEnLinea({ data }: { data: HistoriaClinicaData }) {
  return (
    <SeccionColapsable title={`Soporte en Línea`} badge={
      <span className="flex items-center gap-1.5">
        <span className="text-[9px] text-black-45">{data.soporteLoading ? "…" : `${data.soporteTotal} incidencias`}</span>
      </span>
    }>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-black-45">Período:</span>
          {[["7", "7d"], ["30", "30d"], ["90", "90d"], ["todo", "Todo"]].map(([v, label]) => (
            <button key={v} type="button" onClick={() => data.setPeriodoInc(v)}
              className={cn("rounded px-2 py-0.5 text-[9px] font-medium", data.periodoInc === v ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}>
              {label}
            </button>
          ))}
        </div>

        {data.soporteLoading ? (
          <p className="text-[10px] text-black-25">Cargando incidencias…</p>
        ) : data.soporteTotal === 0 ? (
          <p className="text-[10px] text-black-25">Sin incidencias registradas</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <SoporteKpi label="Total" value={String(data.soporteTotal)} />
              <SoporteKpi label="Abiertas" value={String(data.soporteAbiertas)} tone={data.soporteAbiertas > 0 ? "warn" : "plain"} />
              <SoporteKpi label="Cerradas" value={String(data.soporteTotal - data.soporteAbiertas)} />
              <SoporteKpi label="Prom. espera" value={data.soportePromEspera != null ? `${data.soportePromEspera} min` : "—"} />
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <SoporteKpi label="Prom. solución" value={data.soportePromSolucion != null ? `${data.soportePromSolucion} min` : "—"} />
              <SoporteKpi label="Última incidencia" value={data.soporteUltima} wide />
              <SoporteKpi label="Primera incidencia" value={data.soportePrimera} wide />
            </div>

            {data.soporteCategoriasOrdenadas.length > 0 && (
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Por categoría</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.soporteCategoriasOrdenadas.slice(0, 8).map(([cat, n]) => (
                    <span key={cat} className="rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary">{cat} · {n}</span>
                  ))}
                </div>
              </div>
            )}

            {data.soporteData?.porDominio.some((d) => d.resumen.porLocal.length > 0) && (
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Por local</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.soporteData.porDominio.flatMap((d) => d.resumen.porLocal.map((l) => ({ ...l, dominio: d.dominio }))).map((l, i) => (
                    <span key={i} className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-65">{l.nombre} · {l.cantidad}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Últimas incidencias</p>
              <div className="space-y-1">
                {data.soporteData?.porDominio.flatMap((d) => d.ultimasIncidencias.slice(0, 3).map((inc) => ({ ...inc, dominio: d.dominio })))
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
  );
}

function SoporteKpi({ label, value, tone, wide }: { label: string; value: React.ReactNode; tone?: "warn" | "plain"; wide?: boolean }) {
  const cls = tone === "warn" ? "text-warning-65" : "text-black-85";
  return (
    <div className={cn("rounded border border-black-10 bg-light px-2 py-1.5", wide && "col-span-2")}>
      <p className={cn("text-sm font-semibold leading-tight", cls)}>{value}</p>
      <p className="mt-0.5 text-[9px] text-black-45">{label}</p>
    </div>
  );
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

/** Badge de estado de ticket/tarea. */
function EstadoTareaBadge({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <ND />;
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", tonoEstadoTarea(estado))}>{estado}</span>;
}

/** Tono semántico del estado de una tarea/ticket (presentación). */
function tonoEstadoTarea(estado: string | null | undefined): string {
  const e = (estado ?? "").toLowerCase();
  if (/rechaz/.test(e)) return "bg-danger-5 text-danger";
  if (/complet|hecho|resuelt|cerrad/.test(e)) return "bg-success-5 text-success";
  if (/proceso|curso|prueba/.test(e)) return "bg-primary-5 text-primary";
  return "bg-black-5 text-black-45";
}