import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ClienteInfo, ResultadoAtencion } from "./types";
import { cn } from "@/lib/utils";

interface Props { data: ClienteInfo; loading?: boolean }

const RESULTADO_COLOR: Record<ResultadoAtencion, string> = {
  responder: "bg-success-5 text-success border-emerald-200",
  gestionar: "bg-warning-5 text-warning-65 border-amber-200",
  dev: "bg-purple-5 text-purple border-purple-200",
};

const RESULTADO_LABEL: Record<ResultadoAtencion, string> = {
  responder: "Responder",
  gestionar: "Gestionar",
  dev: "DEV",
};

function CollapsibleCard({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="rounded-lg border border-black-10">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-black-45">
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        {title}
      </button>
      {open && <div className="space-y-1.5 px-3 pb-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-black-25">{label}</span>
      <span className="text-right font-medium text-black-85">{children}</span>
    </div>
  );
}

export function TabHistorial({ data, loading }: Props) {
  if (loading) return <div className="space-y-2 p-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-black-10" />)}</div>;
  return (
    <div className="space-y-2 p-3">
      <CollapsibleCard title="Timeline de Atenciones">
        <div className="space-y-1">
          {data.ultimasAtenciones.map((a, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-black-85">{a.canal}</span>
                  <span className="shrink-0 text-[10px] text-black-25">{a.fecha}</span>
                </div>
                <p className="text-[10px] text-black-45">{a.asesor} · {a.categoria}{a.subcategoria ? ` · ${a.subcategoria}` : ""}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-black-25">
                  <span>Resp: {a.tiempoRespuesta}</span>
                  <span>Res: {a.tiempoResolucion}</span>
                  <span className={cn("ml-auto rounded-md border px-1.5 py-0.5 font-medium", RESULTADO_COLOR[a.resultado])}>
                    {RESULTADO_LABEL[a.resultado]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Métricas de Historial" defaultOpen={false}>
        <Field label="Cat. Frecuentes">
          <div className="text-right text-[10px]">{data.categoriasFrecuentes.join(", ")}</div>
        </Field>
        <Field label="Subcat. Frecuentes">
          <div className="text-right text-[10px]">{data.subcategoriasFrecuentes.join(", ")}</div>
        </Field>
        <Field label="Asesor Top">{data.asesorQueMasAtendio}</Field>
        <Field label="Prom. Resolución">{data.promedioResolucion}</Field>
        <Field label="Prom. 1ra Respuesta">{data.promedioPrimeraRespuesta}</Field>
      </CollapsibleCard>
    </div>
  );
}
