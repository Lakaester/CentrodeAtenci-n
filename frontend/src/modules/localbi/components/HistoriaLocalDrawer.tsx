import { X, ArrowLeft } from "lucide-react";
import type { HistoriaLocal, LocalbiTarea, LocalbiTicket } from "@/modules/localbi";
import { EstadoLocalBadge, fmtMoneda, fmtFecha, fmtNps } from "./HistoriaClinicaUI";

interface Props {
  data: HistoriaLocal;
  onVolver: () => void;
  onCerrar: () => void;
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="shrink-0 text-[9px] text-black-25">{label}</span>
      <span className="ml-2 max-w-[60%] truncate text-right text-[10px] font-medium text-black-85">{children}</span>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-black-45">{titulo}</p>
      <div className="rounded-lg border border-black-10 bg-light p-3">{children}</div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-black-10 bg-light px-2 py-1.5">
      <p className="text-sm font-semibold leading-tight text-black-85">{value}</p>
      <p className="mt-0.5 text-[9px] text-black-45">{label}</p>
    </div>
  );
}

export function HistoriaLocalDrawer({ data, onVolver, onCerrar }: Props) {
  const l = data.local;
  const resumenAct = data.actividadLocal.resumen as { total: number; canales: { nombre: string; cantidad: number }[]; categorias: { nombre: string; cantidad: number }[]; ultima_atencion: string | null };
  const soporte = data.soporte ? data.soporte.resumen as { total: number; abiertas: number; cerradas: number; ultima_incidencia: string | null; categorias: { nombre: string; cantidad: number }[] } : null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-black-10 bg-white">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <div className="min-w-0">
            <button type="button" onClick={onVolver} className="inline-flex items-center gap-1 text-[9px] font-medium text-primary hover:underline">
              <ArrowLeft size={11} /> Volver al cliente
            </button>
            <h3 className="truncate text-xs font-semibold text-black-85">{l?.nombre || "Local"}</h3>
            <p className="font-mono text-[9px] text-black-45">{l?.link_dominio || data.dominio || "—"}</p>
          </div>
          <button type="button" onClick={onCerrar} className="rounded p-1 text-black-45 hover:bg-light"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Resumen del local */}
          <Seccion titulo="Resumen del local">
            <Fila label="País">{l?.pais || "—"}</Fila>
            <Fila label="Estado"><EstadoLocalBadge estado={l?.estado ?? ""} /></Fila>
            <Fila label="Plan">{l?.plan || "—"}</Fila>
            <Fila label="Precio">{fmtMoneda(l?.precio)}</Fila>
            <Fila label="Dirección">{l?.direccion || "—"}</Fila>
          </Seccion>

          {/* KPIs */}
          <div className="mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Kpi label="Atenciones" value={resumenAct.total} />
            <Kpi label="Soporte en Línea" value={soporte?.total ?? 0} />
            <Kpi label="Tickets" value={(data.tickets ?? []).length} />
            <Kpi label="NPS" value={fmtNps(data.nps?.llamadabi_nps != null ? Number(data.nps.llamadabi_nps) : null)} />
          </div>

          {/* Actividad COPE por local */}
          <Seccion titulo="Actividad COPE">
            {!data.disponible.actividadLocal && !data.disponible.actividadDominio ? (
              <p className="text-[10px] text-black-25">Sin atenciones registradas.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {(resumenAct.canales ?? []).map((c, i) => (
                    <span key={i} className="rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary">{c.nombre} · {c.cantidad}</span>
                  ))}
                </div>
                <p className="mt-1 text-[9px] text-black-45">
                  {data.disponible.actividadLocal
                    ? "Nivel local (por localbi_id)"
                    : "Nivel dominio (la fuente no permite el local)"}
                </p>
              </>
            )}
          </Seccion>

          {/* Soporte en Línea */}
          <Seccion titulo="Soporte en Línea">
            {!data.disponible.soporte || !soporte ? (
              <p className="text-[10px] text-black-25">Sin incidencias registradas.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <Kpi label="Abiertas" value={soporte.abiertas} />
                  <Kpi label="Cerradas" value={soporte.cerradas} />
                </div>
                <p className="mt-1 text-[9px] text-black-45">
                  Última: {fmtFecha(soporte.ultima_incidencia)} · Nivel dominio (incidencias no identifica local)
                </p>
              </>
            )}
          </Seccion>

          {/* Tickets */}
          <Seccion titulo="Tickets">
            {(data.tickets ?? []).length === 0 && (data.tareasSueltas ?? []).length === 0 ? (
              <p className="text-[10px] text-black-25">Sin tickets ni tareas.</p>
            ) : (
              <div className="space-y-1">
                {(data.tickets ?? []).map((t: LocalbiTicket) => (
                  <div key={t.ticket_id} className="rounded border border-black-5 bg-white p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] font-semibold text-primary">#{t.ticket_id}</span>
                      <span className="truncate text-[10px] font-medium text-black-85">{t.titulo || "—"}</span>
                      <span className="shrink-0 text-[9px] text-black-45">{t.estado}</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-black-45">{t.tipo} · {t.subcategoria || "—"} · {fmtFecha(t.fecha_creacion)}</p>
                  </div>
                ))}
                {(data.tareasSueltas ?? []).map((ta: LocalbiTarea) => (
                  <div key={ta.tarea_id} className="rounded border border-black-5 bg-white p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-medium text-black-85">{ta.titulo || "—"}</span>
                      <span className="shrink-0 text-[9px] text-black-45">{ta.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          {/* NPS */}
          <Seccion titulo="NPS">
            <Fila label="NPS general">{fmtNps(data.nps?.llamadabi_nps != null ? Number(data.nps.llamadabi_nps) : null)}</Fila>
            <Fila label="NPS producto">{fmtNps(data.nps?.llamadabi_npsproducto != null ? Number(data.nps.llamadabi_npsproducto) : null)}</Fila>
            <Fila label="NPS servicio">{fmtNps(data.nps?.llamadabi_npmsservicio != null ? Number(data.nps.llamadabi_npmsservicio) : null)}</Fila>
            {data.nps?.fecha && <Fila label="Fecha">{fmtFecha(data.nps.fecha)}</Fila>}
          </Seccion>
        </div>
      </div>
    </div>
  );
}
