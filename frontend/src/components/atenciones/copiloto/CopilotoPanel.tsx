import { useState } from "react";
import { Sparkles, ChevronDown, CheckCircle2, Circle, Copy, BookOpen, AlertTriangle, Target, ListChecks, Lightbulb, ClipboardX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { MOCK_COPILOTO, type CopilotoData } from "./mock-data";

interface Props {
  data?: CopilotoData;
  onInsertar?: (texto: string) => void;
}

function Section({ title, icon, defaultOpen, children }: { title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="rounded-lg border border-black-10">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-black-85">
        <ChevronDown size={12} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
        {icon}
        <span className="truncate">{title}</span>
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

function BadgeConfianza({ pct }: { pct: number }) {
  const color = pct >= 85 ? "bg-success-5 text-success" : pct >= 60 ? "bg-warning-5 text-warning-65" : "bg-danger-5 text-danger";
  return <span className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-medium", color)}>{pct}%</span>;
}

export function CopilotoPanel({ data = MOCK_COPILOTO, onInsertar }: Props) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard.writeText(data.respuestaSugerida);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 bg-gradient-to-r from-[#F0F7FF] to-white px-4 py-2.5">
        <Sparkles size={16} className="text-primary" />
        <p className="text-sm font-semibold text-black-85">Copiloto COPE</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {/* 1 - Resumen del Caso */}
        <Section title="Resumen del Caso" icon={<Target size={12} />}>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-black-25">Categoría</span><span className="font-medium text-black-85">{data.resumen.categoria}</span></div>
            <div className="flex justify-between"><span className="text-black-25">Subcategoría</span><span className="font-medium text-black-85 text-right max-w-[60%]">{data.resumen.subcategoria}</span></div>
            <div className="flex justify-between items-center"><span className="text-black-25">Confianza</span><BadgeConfianza pct={data.resumen.confianza} /></div>
            <div className="flex justify-between"><span className="text-black-25">Tiempo estimado</span><span className="font-medium text-black-85">{data.resumen.tiempoEstimado}</span></div>
            <div className="flex justify-between"><span className="text-black-25">Prioridad</span><span className="font-medium text-danger">{data.resumen.prioridad}</span></div>
          </div>
        </Section>

        {/* 2 - Qué debo hacer */}
        <Section title="Qué debo hacer" icon={<ListChecks size={12} />}>
          <div className="space-y-1">
            {data.pasos.map((paso, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[9px] font-bold text-primary">{i + 1}</span>
                <span className="text-black-85">{paso}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 3 - Información faltante */}
        <Section title="Información faltante" icon={<ClipboardX size={12} />}>
          <div className="space-y-1">
            {data.infoFaltante.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", item.presente ? "bg-emerald-400" : "bg-rose-400")} />
                <span className={cn(item.presente ? "text-black-45" : "text-black-85 font-medium")}>{item.label}</span>
                {!item.presente && <span className="text-[9px] text-danger">Falta</span>}
              </div>
            ))}
          </div>
        </Section>

        {/* 4 - Respuesta sugerida */}
        <Section title="Respuesta sugerida" icon={<Lightbulb size={12} />}>
          <div className="rounded-lg border border-black-10 bg-light p-2.5 text-xs leading-relaxed text-black-85">
            {data.respuestaSugerida}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="flex-1 text-[10px] h-7 gap-1.5" onClick={handleCopiar}>
              <Copy size={11} /> {copiado ? "Copiado" : "Copiar"}
            </Button>
            <Button size="sm" variant="primary" className="flex-1 text-[10px] h-7 gap-1.5" onClick={() => onInsertar?.(data.respuestaSugerida)}>
              Insertar en conversación
            </Button>
          </div>
        </Section>

        {/* 5 - Macros */}
        <Section title="Macros recomendadas" icon={<Sparkles size={12} />}>
          <div className="space-y-1">
            {data.macros.map((m, i) => (
              <div key={i} className="rounded-lg border border-black-5 bg-light p-2 text-xs text-black-85">{m}</div>
            ))}
          </div>
        </Section>

        {/* 6 - NotebookLM */}
        <Section title="NotebookLM" icon={<BookOpen size={12} />}>
          <div className="rounded-lg border border-black-10 bg-[#FFF7ED] p-2.5 text-xs text-black-85">{data.notebookLM}</div>
          <Button size="sm" variant="secondary" className="w-full text-[10px] h-7 gap-1.5">
            <BookOpen size={11} /> Abrir Notebook
          </Button>
        </Section>

        {/* 7 - Casos similares */}
        <Section title="Casos similares" icon={<Copy size={12} />}>
          <div className="space-y-1">
            {data.casosSimilares.map((c, i) => (
              <div key={i} className="rounded-lg border border-black-5 p-2 text-xs">
                <div className="flex justify-between"><span className="font-medium text-black-85">{c.cliente}</span><span className="text-[10px] text-black-25">{c.fecha}</span></div>
                <p className="mt-0.5 text-[10px] text-success">{c.resultado}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 8 - Checklist Inteligente */}
        <Section title="Checklist Inteligente" icon={<CheckCircle2 size={12} />}>
          <div className="space-y-1">
            {data.checklist.map((item, i) => (
              <button key={i} className="flex w-full items-center gap-2 rounded-lg border border-black-5 p-2 text-xs text-left">
                {item.checked ? <CheckCircle2 size={14} className="shrink-0 text-success" /> : <Circle size={14} className="shrink-0 text-black-10" />}
                <span className={cn(item.checked && "text-black-25 line-through")}>{item.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* 9 - Alertas */}
        <Section title="Alertas" icon={<AlertTriangle size={12} />}>
          <div className="space-y-1">
            {data.alertas.map((a, i) => (
              <div key={i} className={cn("flex items-start gap-2 rounded-lg border border-black-10 border-l-4 p-2 text-xs", a.tipo === "alta" ? "border-l-rose-500" : a.tipo === "media" ? "border-l-amber-400" : "border-l-sky-400")}>
                <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", a.tipo === "alta" ? "bg-danger-50" : a.tipo === "media" ? "bg-amber-400" : "bg-sky-400")} />
                <span className="text-black-85">{a.texto}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 10 - Antes de cerrar */}
        <Section title="Antes de cerrar" icon={<ClipboardX size={12} />}>
          <div className="space-y-1">
            {data.antesCerrar.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", item.ok ? "bg-emerald-400" : "bg-rose-400")} />
                <span className={cn(item.ok ? "text-black-45" : "text-black-85 font-medium")}>{item.label}</span>
                {!item.ok && <span className="text-[9px] text-danger">Pendiente</span>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
