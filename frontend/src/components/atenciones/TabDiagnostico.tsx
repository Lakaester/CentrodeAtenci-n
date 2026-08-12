import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle, Clock, AlertTriangle, ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import type { ClienteInfo } from "./types";
import { cn } from "@/lib/utils";
import { getChecklistItems } from "./mock-data";

interface Props { data: ClienteInfo; loading?: boolean }

function CardWrapper({ title, icon, defaultOpen, children }: { title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="rounded-lg border border-black-10">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-black-45">
        <ChevronDown size={12} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{title}</span>
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

const CONFIANZA_COLOR: Record<string, string> = {
  alta: "bg-success-5 text-success border-emerald-200",
  media: "bg-warning-5 text-warning-65 border-amber-200",
  baja: "bg-danger-5 text-danger border-rose-200",
};

function nivelConfianza(pct: number): string {
  if (pct >= 85) return "alta";
  if (pct >= 60) return "media";
  return "baja";
}

const RIESGO_COLOR: Record<string, string> = {
  alta: "border-l-rose-500 bg-danger-5/40",
  media: "border-l-amber-400 bg-warning-5/40",
  baja: "border-l-sky-400 bg-aqua-5/40",
};

const RIESGO_DOT: Record<string, string> = {
  alta: "bg-danger-50",
  media: "bg-amber-400",
  baja: "bg-sky-400",
};

const ACCESOS = [
  "Abrir Dominio", "Abrir Restafact", "Abrir Integraciones",
  "Abrir Dashboard FE", "Abrir Dashboard Chile", "Abrir NotebookLM",
  "Abrir Microservice", "Abrir Postman",
];

export function TabDiagnostico({ data, loading }: Props) {
  const d = data.diagnostico;
  if (loading) return <div className="space-y-2 p-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-black-10" />)}</div>;

  const confianzaNivel = nivelConfianza(d.confianza);
  const checklist = d.checklist.length > 0 ? d.checklist : getChecklistItems(d.categoriaSugerida);

  return (
    <div className="space-y-2 p-3">
      {/* 1. Categoría sugerida */}
      <CardWrapper title="Categoría sugerida" icon={<Sparkles size={12} />}>
        <div className="rounded-lg border border-black-10 bg-light p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-black-85">{d.categoriaSugerida}</p>
              <p className="text-[10px] text-black-45">{d.subcategoriaSugerida}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{d.confianza}%</p>
              <span className={cn("inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-medium", CONFIANZA_COLOR[confianzaNivel])}>
                {confianzaNivel === "alta" ? "Alta confianza" : confianzaNivel === "media" ? "Confianza media" : "Confianza baja"}
              </span>
            </div>
          </div>
        </div>
      </CardWrapper>

      {/* 2. Checklist */}
      <CardWrapper title="Checklist automático" icon={<CheckCircle2 size={12} />}>
        <div className="space-y-1">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
              {item.checked ? (
                <CheckCircle2 size={14} className="shrink-0 text-success" />
              ) : (
                <Circle size={14} className="shrink-0 text-black-10" />
              )}
              <span className={cn("text-black-85", item.checked && "text-black-25 line-through")}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardWrapper>

      {/* 3. Posibles causas */}
      <CardWrapper title="Posibles causas" icon={<AlertTriangle size={12} />}>
        <div className="space-y-1">
          {d.posiblesCausas.map((causa, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
              <span className="mt-0.5 text-success">✔</span>
              <span className="text-black-85">{causa}</span>
            </div>
          ))}
        </div>
      </CardWrapper>

      {/* 4. Casos similares */}
      <CardWrapper title="Casos similares" icon={<Clock size={12} />}>
        <div className="space-y-1">
          {d.casosSimilares.map((caso, i) => (
            <div key={i} className="rounded-lg border border-black-5 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-black-85">{caso.cliente}</span>
                <span className="text-[10px] text-black-25">{caso.fecha}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-black-45">{caso.categoria}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-success">{caso.resultado}</span>
                <button className="text-[10px] font-medium text-primary hover:underline">Ver detalle</button>
              </div>
            </div>
          ))}
        </div>
      </CardWrapper>

      {/* 5. Recomendaciones */}
      <CardWrapper title="Recomendaciones" icon={<Sparkles size={12} />}>
        <div className="space-y-1">
          {d.recomendaciones.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-black-10 bg-[#F0F7FF] p-2.5 text-xs">
              <ArrowRight size={12} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-black-85">{rec}</span>
            </div>
          ))}
        </div>
      </CardWrapper>

      {/* 6. Riesgos */}
      <CardWrapper title="Riesgos" icon={<AlertTriangle size={12} />}>
        <div className="space-y-1">
          {d.riesgos.map((r, i) => (
            <div key={i} className={cn("flex items-start gap-2 rounded-lg border border-black-10 border-l-4 p-2.5 text-xs", RIESGO_COLOR[r.tipo])}>
              <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", RIESGO_DOT[r.tipo])} />
              <span className="text-black-85">{r.texto}</span>
            </div>
          ))}
        </div>
      </CardWrapper>

      {/* 7. Tiempo estimado */}
      <CardWrapper title="Tiempo estimado" icon={<Clock size={12} />}>
        <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-10 text-primary">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-black-85">{d.tiempoEstimado}</p>
            <p className="text-[10px] text-black-45">Basado en {d.casosSimilares.length} casos similares</p>
          </div>
        </div>
      </CardWrapper>

      {/* 8. Accesos rápidos */}
      <CardWrapper title="Accesos rápidos" icon={<ExternalLink size={12} />} defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          {ACCESOS.map((a) => (
            <button
              key={a}
              className="inline-flex items-center gap-1 rounded-md border border-black-10 bg-white px-2 py-1 text-[9px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary"
            >
              <ExternalLink size={8} />
              {a}
            </button>
          ))}
        </div>
      </CardWrapper>
    </div>
  );
}
