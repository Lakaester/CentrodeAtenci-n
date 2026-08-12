import { FileText, Wrench, Activity, AlertCircle, Target, ExternalLink, CheckCircle, BookOpen, Info, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceESPData {
  tipo: string;
  cliente: { dominio: string; contacto: string; producto: string | null; pais: string; tipoCliente: string | null };
  guia: {
    objetivo: string;
    procesoRecomendado: string[];
    buenasPracticas: string[];
    informacionNecesaria: string[];
    criteriosResolucion: string[];
  };
  posiblesCausas: string[];
  herramientas: string[];
  estadoOperativo: { label: string; valor: string | null }[];
  resultado: { resumen: string; causaIdentificada: string; accionRealizada: string; resultado: string; observaciones: string } | null;
}

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

function InfoND() {
  return <span className="text-black-10 italic">Información no disponible</span>;
}

export function WorkspaceRenderer({ data }: { data: WorkspaceESPData }) {
  return (
    <div className="space-y-2">
      {/* 1. Cliente */}
      <Card title="Cliente" icon={<Target size={13} className="text-primary" />}>
        <div className="space-y-1 text-xs">
          {[["Dominio", data.cliente.dominio], ["Contacto", data.cliente.contacto], ["País", data.cliente.pais], ["Producto", data.cliente.producto ?? <InfoND />]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between"><span className="text-black-25">{l as string}</span><span className="font-medium text-black-85">{v as React.ReactNode}</span></div>
          ))}
          <div className="flex justify-between">
            <span className="text-black-25">Tipo cliente</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase",
              data.cliente.tipoCliente === "high_touch" ? "border-purple-200 bg-purple-5 text-purple" : "border-sky-200 bg-aqua-5 text-aqua")}>
              {data.cliente.tipoCliente?.replace("_", " ") ?? <InfoND />}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Guía de Resolución */}
      <Card title="Guía de Resolución" icon={<BookOpen size={13} className="text-[#6366F1]" />}>
        <div className="space-y-3 text-xs">
          <div><p className="font-medium text-black-85 mb-1">Objetivo</p><p className="text-black-45">{data.guia.objetivo}</p></div>
          <div><p className="font-medium text-black-85 mb-1">Proceso recomendado</p>
            <div className="space-y-1">
              {data.guia.procesoRecomendado.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[9px] font-bold text-primary">{i + 1}</span>
                  <span className="text-black-85">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div><p className="font-medium text-black-85 mb-1">Buenas prácticas</p>
            <div className="space-y-1">
              {data.guia.buenasPracticas.map((bp, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2">
                  <Star size={12} className="mt-0.5 shrink-0 text-amber-400" />
                  <span className="text-black-45">{bp}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-black-10 bg-light p-2">
              <p className="font-medium text-black-85 mb-1">Información necesaria</p>
              {data.guia.informacionNecesaria.map((inf, i) => (
                <p key={i} className="text-black-45">• {inf}</p>
              ))}
            </div>
            <div className="rounded-lg border border-black-10 bg-light p-2">
              <p className="font-medium text-black-85 mb-1">Criterios de resolución</p>
              {data.guia.criteriosResolucion.map((cr, i) => (
                <p key={i} className="flex items-start gap-1 text-black-45"><CheckCircle size={10} className="mt-0.5 shrink-0 text-success" /> {cr}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Posibles causas */}
      <Card title="Posibles causas" icon={<AlertCircle size={13} className="text-warning" />}>
        <div className="space-y-1">
          {data.posiblesCausas.map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
              <span className="mt-0.5 shrink-0 text-success">•</span>
              <span className="text-black-85">{c}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Herramientas */}
      <Card title="Herramientas" icon={<Wrench size={13} className="text-primary" />}>
        <div className="flex flex-wrap gap-1.5">
          {data.herramientas.map((h) => (
            <button key={h} className="inline-flex items-center gap-1 rounded-md border border-black-10 bg-white px-2.5 py-1.5 text-[11px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary">
              <ExternalLink size={10} /> {h}
            </button>
          ))}
        </div>
      </Card>

      {/* 5. Estado Operativo */}
      <Card title="Estado Operativo" icon={<Activity size={13} className="text-success" />}>
        <div className="space-y-1 text-xs">
          {data.estadoOperativo.map((item) => (
            <div key={item.label} className="flex justify-between py-1">
              <span className="text-black-25">{item.label}</span>
              <span className="font-medium text-black-85">{item.valor ?? <InfoND />}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Resultado */}
      <Card title="Resultado de Atención" icon={<FileText size={13} className="text-black-25" />}>
        {data.resultado ? (
          <div className="space-y-2 text-xs">
            {[["Resumen", data.resultado.resumen], ["Causa identificada", data.resultado.causaIdentificada], ["Acción realizada", data.resultado.accionRealizada], ["Resultado", data.resultado.resultado], ["Observaciones", data.resultado.observaciones]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg border border-black-5 p-2">
                <p className="font-medium text-black-25 text-[10px]">{l as string}</p>
                <p className="text-black-85 mt-0.5">{v as string}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Info size={18} className="text-black-10" />
            <p className="text-xs text-black-25">Resultado pendiente de registrar al cerrar el ticket</p>
            <p className="text-[10px] text-black-10">Completar: resumen, causa, acción realizada, resultado y observaciones</p>
          </div>
        )}
      </Card>
    </div>
  );
}
