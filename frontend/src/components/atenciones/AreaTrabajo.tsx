import { useState } from "react";
import { MessageSquare, CheckCircle, Tag, BookOpen, Zap, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "@/components/ui/AutoResizeTextarea";
import type { WorkspaceResponse } from "./useTicketWorkspace";

interface Props { workspace: WorkspaceResponse }

const PLANTILLAS = [
  "Estimado {{cliente}}, hemos identificado el problema y estamos trabajando en la solución.",
  "Hemos procesado su solicitud. El comprobante será emitido en las próximas 24 horas.",
  "Informamos que el error ha sido corregido. Puede verificar el estado en su panel.",
];

const MACROS = [
  { nombre: "Saludo formal", contenido: "Estimado {{cliente}}, reciba un cordial saludo." },
  { nombre: "Despedida", contenido: "Quedamos atentos a cualquier consulta adicional." },
  { nombre: "SLA", contenido: "Le confirmamos que su caso será resuelto dentro del SLA establecido." },
];

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-3 py-2">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-black-85">{title}</span>
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-1 text-[10px] font-medium text-black-25">{label}</p>{children}</div>;
}

export function AreaTrabajo({ workspace }: Props) {
  const at = workspace.areaTrabajo;
  const [respuesta, setRespuesta] = useState(at?.respuesta.contenido ?? "");


  const insertarEnRespuesta = (texto: string) => {
    const conVariables = texto
      .replace("{{cliente}}", workspace.contacto.nombre)
      .replace("{{dominio}}", workspace.contacto.dominio)
      .replace("{{canal}}", workspace.contacto.categoriaActual ?? "");
    setRespuesta((prev) => prev + (prev ? "\n\n" : "") + conVariables);
  };

  return (
    <div className="space-y-2">
      {/* 1. Diagnóstico */}
      <SectionCard title="Diagnóstico" icon={<Lightbulb size={13} className="text-[#6366F1]" />}>
        <Field label="Problema identificado">
          <textarea className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs min-h-[50px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            placeholder="Describa el problema identificado..." />
        </Field>
        <Field label="Causa">
          <textarea className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs min-h-[50px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            placeholder="Indique la causa del problema..." />
        </Field>
        <Field label="Análisis realizado">
          <textarea className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs min-h-[60px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            placeholder="Documente el análisis realizado..." />
        </Field>
      </SectionCard>

      {/* 2. Respuesta al Cliente */}
      <SectionCard title="Respuesta al Cliente" icon={<MessageSquare size={13} className="text-primary" />}>
        {/* Plantillas */}
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-25"><BookOpen size={11} /> Plantillas</p>
          <div className="flex flex-wrap gap-1">
            {PLANTILLAS.map((p, i) => (
              <button key={i} onClick={() => insertarEnRespuesta(p)}
                className="rounded-md border border-black-10 bg-light px-2 py-1 text-[9px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary">
                Plantilla {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-25"><Zap size={11} /> Macros rápidas</p>
          <div className="flex flex-wrap gap-1">
            {MACROS.map((m, i) => (
              <button key={i} onClick={() => insertarEnRespuesta(m.contenido)}
                className="rounded-md border border-black-10 bg-[#F0F7FF] px-2 py-1 text-[9px] text-primary transition-colors hover:bg-primary hover:text-white">
                {m.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <Field label="Redactar respuesta">
          <AutoResizeTextarea value={respuesta} onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Redacte aquí su respuesta al cliente..."
            minHeight={120}
            maxHeight={360}
            className="text-xs" />
        </Field>

        <div className="flex items-center justify-between text-[10px] text-black-25">
          <span>Variables disponibles: {'{cliente}'}, {'{dominio}'}, {'{canal}'}</span>
          <span className="font-medium">{respuesta.length} caracteres</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-85 disabled:opacity-50" disabled={!respuesta.trim()}>
            Enviar respuesta (próximamente)
          </button>
        </div>
      </SectionCard>

      {/* 3. Resultado de la Atención */}
      <SectionCard title="Resultado de la Atención" icon={<CheckCircle size={13} className="text-success" />}>
        <Field label="Acción realizada">
          <textarea className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs min-h-[50px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            placeholder="Registre la acción realizada..." />
        </Field>
        <Field label="Estado final">
          <select className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs text-black-85 focus:border-[#2563EB] focus:outline-none">
            <option value="">Seleccione...</option>
            <option value="resuelto">Resuelto</option>
            <option value="parcial">Parcialmente resuelto</option>
            <option value="escalado">Escalado</option>
            <option value="pendiente">Pendiente</option>
            <option value="sin_respuesta">Sin respuesta</option>
            <option value="duplicado">Duplicado</option>
          </select>
        </Field>
        <Field label="Observaciones">
          <textarea className="w-full rounded-lg border border-black-10 bg-light px-3 py-2 text-xs min-h-[50px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            placeholder="Observaciones adicionales..." />
        </Field>
      </SectionCard>

      {/* 4. Clasificación */}
      <SectionCard title="Clasificación" icon={<Tag size={13} className="text-primary" />}>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
            <span className="text-black-25">Tipo de Atención</span>
            <span className="font-medium text-black-85">{at?.clasificacion.tipoAtencion || "—"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
            <span className="text-black-25">Subcategoría</span>
            <span className="font-medium text-black-85">{at?.clasificacion.subcategoria || "—"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
            <span className="text-black-25">Dominio</span>
            <span className="font-medium text-black-85">{at?.clasificacion.dominio || "—"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
            <span className="text-black-25">Canal</span>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium",
              at?.clasificacion.canal === "whaticket" ? "bg-success-5 text-success" : "bg-primary-5 text-primary")}>
              {at?.clasificacion.canal ?? "—"}
            </span>
          </div>
          {workspace.origen && (
            <>
              <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
                <span className="text-black-25">Canal origen</span>
                <span className="font-medium text-black-85">{workspace.origen.canal === "zendesk" ? "Zendesk" : workspace.origen.canal === "wameta" ? "Meta" : "Whaticket"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
                <span className="text-black-25">Ticket original</span>
                <span className="font-medium text-black-85">#{workspace.origen.ticketOriginalId}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-black-5 p-2">
                <span className="text-black-25">Estado original</span>
                <span className="rounded bg-black-5 px-1.5 py-0.5 text-[10px] font-medium capitalize text-black-85">{workspace.origen.ticketOriginalStatus}</span>
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
