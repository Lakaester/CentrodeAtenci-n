import { CheckCircle2, Circle, Target, ExternalLink, FileText, Zap, Search, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceResponse } from "./useTicketWorkspace";

interface Props { data: WorkspaceResponse["centroResolucion"] }

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

function EmptyDiagnostico() {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <Search size={20} className="text-black-10" />
      <p className="text-xs text-black-25">El diagnóstico se generará automáticamente</p>
      <p className="text-[10px] text-black-10">IA próximamente</p>
    </div>
  );
}

export function CentroResolucion({ data }: Props) {
  if (!data) return null;

  return (
    <div className="space-y-2">
      {/* 1. Objetivo + Tiempos */}
      <Card title="Objetivo de la atención" icon={<Target size={13} className="text-primary" />}>
        <div className="rounded-lg border border-black-10 bg-light p-2.5 text-xs text-black-85">
          {data.objetivo || "Objetivo pendiente de definir."}
        </div>
        <div className="flex items-center gap-3 pt-1 text-[10px] text-black-45">
          <span className="flex items-center gap-1"><Clock size={11} /> {data.tiempoTranscurrido}</span>
          <span className={cn("flex items-center gap-1 font-medium", data.tiempoRestanteSLA === "Vencido" ? "text-danger" : "text-success")}>
            <ShieldAlert size={11} /> SLA: {data.tiempoRestanteSLA}
          </span>
        </div>
      </Card>

      {/* 2. Diagnóstico */}
      <Card title="Diagnóstico" icon={<Search size={13} className="text-[#6366F1]" />}>
        <EmptyDiagnostico />
      </Card>

      {/* 3. Checklist Operativo */}
      {data.checklist.length > 0 && (
        <Card title="Checklist operativo" icon={<CheckCircle2 size={13} className="text-success" />}>
          <div className="space-y-1">
            {[...data.checklist].sort((a, b) => a.orden - b.orden).map((item) => (
              <div key={item.id} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
                {item.completado ? (
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <Circle size={14} className="mt-0.5 shrink-0 text-black-10" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", item.completado ? "text-black-25 line-through" : "text-black-85")}>
                      {item.orden}. {item.nombre}
                    </span>
                    {item.obligatorio && <span className="text-[9px] text-danger">*</span>}
                  </div>
                  <p className={cn("text-[10px]", item.completado ? "text-black-10" : "text-black-25")}>{item.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Acciones rápidas */}
      {data.accionesRapidas.length > 0 && (
        <Card title="Acciones rápidas" icon={<Zap size={13} className="text-primary" />}>
          <div className="flex flex-wrap gap-1.5">
            {data.accionesRapidas.map((a) => (
              <button key={a.id} className="inline-flex items-center gap-1 rounded-md border border-black-10 bg-white px-2.5 py-1.5 text-[11px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary">
                <ExternalLink size={10} /> {a.nombre}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Estado de resolución */}
      {data.etapas.length > 0 && (
        <Card title="Estado de resolución" icon={<FileText size={13} className="text-[#6366F1]" />}>
          {/* Barra de progreso */}
          <div className="flex gap-1 mb-3">
            {data.etapas.map((etapa) => (
              <div key={etapa.id} className="flex-1">
                <div className={cn("h-1.5 rounded-full", etapa.completada ? "bg-success-50" : etapa.activa ? "bg-primary" : "bg-black-10")} />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {data.etapas.map((etapa) => (
              <div key={etapa.id} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
                {etapa.completada ? (
                  <CheckCircle2 size={14} className="shrink-0 text-success" />
                ) : etapa.activa ? (
                  <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                ) : (
                  <Circle size={14} className="shrink-0 text-black-10" />
                )}
                <span className={cn(etapa.completada && "text-black-25 line-through", etapa.activa && "font-semibold text-primary", !etapa.completada && !etapa.activa && "text-black-45")}>
                  {etapa.nombre}
                </span>
                {etapa.activa && <span className="ml-auto text-[9px] font-medium text-primary">Actual</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Notas operativas */}
      <Card title="Notas operativas" icon={<FileText size={13} className="text-black-25" />}>
        {data.notasOperativas.length === 0 ? (
          <p className="text-xs text-black-25">Sin notas operativas registradas</p>
        ) : (
          <div className="space-y-1">
            {data.notasOperativas.map((nota, i) => (
              <div key={i} className="rounded-lg border border-black-5 bg-light p-2 text-xs text-black-85">{nota}</div>
            ))}
          </div>
        )}
      </Card>

      {/* 7. Riesgos */}
      <Card title="Riesgos" icon={<ShieldAlert size={13} className="text-danger" />}>
        {data.riesgos.length === 0 ? (
          <p className="text-xs text-success">No se detectan riesgos</p>
        ) : (
          <div className="space-y-1">
            {data.riesgos.map((r, i) => (
              <div key={i} className={cn("flex items-start gap-2 rounded-lg border border-black-10 border-l-4 p-2 text-xs",
                r.tipo === "alta" ? "border-l-rose-500 bg-danger-5/40" : r.tipo === "media" ? "border-l-amber-400 bg-warning-5/40" : "border-l-sky-400 bg-aqua-5/40")}>
                <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", r.tipo === "alta" ? "bg-danger-50" : r.tipo === "media" ? "bg-amber-400" : "bg-sky-400")} />
                <span className="text-black-85">{r.texto}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
