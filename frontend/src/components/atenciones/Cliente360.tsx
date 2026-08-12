import { Clock, Wrench, Bug, AlertTriangle, Activity, User, Headphones, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceResponse } from "./useTicketWorkspace";

interface Props { workspace: WorkspaceResponse }

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-3 py-2">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-black-85">{title}</span>
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between py-1 text-xs"><span className="text-black-25">{label}</span><span className="text-right font-medium text-black-85">{children}</span></div>;
}

function InfoND() { return <span className="text-black-10 italic">Información no disponible</span>; }

function EmptyList({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return <div className="flex flex-col items-center gap-2 py-4 text-center"><div className="text-black-10">{icon}</div><p className="text-xs text-black-25">{msg}</p></div>;
}

export function Cliente360({ workspace }: Props) {
  const c = workspace.contacto;
  const s = workspace.cliente360.salud;
  const h = workspace.historial;
  const ms = workspace.cliente360.microservice;
  const sinDominio = !c.dominio || c.dominio === "";
  const tools = workspace.herramientas.flatMap((g) => g.herramientas);

  return (
    <div className="space-y-2">
      {sinDominio && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-warning-5 p-2.5 text-xs text-amber-800">
          <AlertTriangle size={14} className="shrink-0" />
          <div><p className="font-medium">Este Ticket aún no tiene un dominio vinculado.</p><p className="mt-0.5 text-[10px] text-warning">Búsqueda por dominio, correo, teléfono o RUC próximamente.</p></div>
        </div>
      )}

      {/* Identificación */}
      <SectionCard title="Identificación" icon={<User size={13} className="text-primary" />}>
        <Field label="Dominio">{c.dominio || <span className="text-warning">Pendiente</span>}</Field>
        <Field label="Razón social">{ms?.cliente.razonSocial ?? <InfoND />}</Field>
        <Field label="RUC">{ms?.cliente.ruc ?? <InfoND />}</Field>
        <Field label="País">{(ms?.cliente.pais ?? c.pais) || <InfoND />}</Field>
        <Field label="Estado">{ms?.cliente.estado ?? <InfoND />}</Field>
        <Field label="Tipo cliente">
          {c.tipoCliente ? (
            <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", c.tipoCliente === "high_touch" ? "border-purple-200 bg-purple-5 text-purple" : "border-sky-200 bg-aqua-5 text-aqua")}>
              {c.tipoCliente.replace("_", " ")}
            </span>
          ) : <InfoND />}
        </Field>
        <Field label="Producto">{c.producto ?? (ms?.cliente.productos?.join(", ") ?? <InfoND />)}</Field>
        {ms && <>
          <Field label="LTV">{ms.cliente.ltv ?? <InfoND />}</Field>
          <Field label="Locales">{ms.cliente.cantidadLocales != null ? String(ms.cliente.cantidadLocales) : <InfoND />}</Field>
          <Field label="Estado salud">{ms.cliente.estadoSalud ?? <InfoND />}</Field>
        </>}
      </SectionCard>

      {/* Salud */}
      <SectionCard title="Salud del Cliente" icon={<Activity size={13} className="text-success" />}>
        <Field label="Antigüedad">{s.antiguedad ?? <InfoND />}</Field>
        <Field label="Última actividad">{s.ultimaActividad ? new Date(s.ultimaActividad).toLocaleDateString("es-PE") : <InfoND />}</Field>
        {ms && <>
          <Field label="CSM">{ms.comercial.csm ?? <InfoND />}</Field>
          <Field label="Churn">{ms.comercial.churn ?? <InfoND />}</Field>
          <Field label="Estado comercial">{ms.comercial.estadoComercial ?? <InfoND />}</Field>
        </>}
      </SectionCard>

      {/* Microservice: Soporte */}
      {ms && (
        <SectionCard title="Soporte en Línea" icon={<Headphones size={13} className="text-primary" />}>
          <Field label="Reincidencias">{String(ms.soporte.reincidencias)}</Field>
          {ms.soporte.ultimasIncidencias.length > 0 ? (
            <div className="space-y-1">
              {ms.soporte.ultimasIncidencias.slice(0, 3).map((inc, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="flex-1"><span className="font-medium text-black-85">{inc.categoria}</span><p className="text-[10px] text-black-45">{inc.fecha} · {inc.estado}</p></div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-black-25">Sin incidencias registradas</p>}
          <div className="flex gap-1.5 pt-1">
            <button className="inline-flex items-center gap-1 rounded-md border border-black-10 px-2 py-1 text-[9px] text-black-45 hover:border-[#2563EB] hover:text-primary"><ExternalLink size={8} /> Ver Historial</button>
          </div>
        </SectionCard>
      )}

      {/* Microservice: Desarrollo */}
      {ms && (
        <SectionCard title="Desarrollo" icon={<Bug size={13} className="text-purple" />}>
          {ms.desarrollo.tickets.length === 0 ? (
            <EmptyList icon={<Bug size={20} />} msg="Sin tickets DEV asociados" />
          ) : (
            <div className="space-y-1">
              {ms.desarrollo.tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-black-5 p-2 text-xs">
                  <div><p className="font-medium text-black-85">{t.id}</p><p className="text-[10px] text-black-45">{t.proyecto}</p></div>
                  <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-65">{t.estado}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 pt-1">
            <button className="inline-flex items-center gap-1 rounded-md border border-black-10 px-2 py-1 text-[9px] text-black-45 hover:border-[#2563EB] hover:text-primary"><ExternalLink size={8} /> Ver Tickets DEV</button>
          </div>
        </SectionCard>
      )}

      {/* Últimas Atenciones */}
      <SectionCard title="Últimas Atenciones" icon={<Clock size={13} className="text-primary" />}>
        {h.length === 0 ? (
          <EmptyList icon={<Clock size={20} />} msg="Sin atenciones previas" />
        ) : (
          <div className="space-y-1">
            {h.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between"><span className="font-medium text-black-85">{item.canal}</span><span className="text-[10px] text-black-25">{item.fecha ? new Date(item.fecha).toLocaleDateString("es-PE") : ""}</span></div>
                  <p className="text-[10px] text-black-45">{item.categoria}{item.subcategoria ? ` · ${item.subcategoria}` : ""}{item.asesor ? ` · ${item.asesor}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Herramientas */}
      {tools.length > 0 && (
        <SectionCard title="Herramientas" icon={<Wrench size={13} className="text-[#6366F1]" />}>
          <div className="flex flex-wrap gap-1">
            {tools.map((h) => (
              <button key={h} className="inline-flex items-center gap-1 rounded-md border border-black-10 bg-white px-2 py-1 text-[9px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary"><ExternalLink size={8} />{h}</button>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Botón Microservice */}
      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2563EB]/30 bg-[#F0F7FF] py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
        <ExternalLink size={13} /> Abrir Microservice
      </button>
    </div>
  );
}
