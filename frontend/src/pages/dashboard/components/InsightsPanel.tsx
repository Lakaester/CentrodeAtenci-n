import { Flame, Layers, Lightbulb, ShieldAlert, TrendingUp, Users } from "lucide-react";
import type { Insight } from "../utils/insights";
import { cn } from "@/lib/utils";

const TONE = {
  good: { border: "border-success-25", bg: "bg-success-5", icon: "text-success", badge: "bg-success-5 text-success" },
  warn: { border: "border-primary-25", bg: "bg-primary-5", icon: "text-warning", badge: "bg-primary-5 text-warning" },
  bad: { border: "border-danger-25", bg: "bg-danger-5", icon: "text-danger", badge: "bg-danger-5 text-danger" },
  neutral: { border: "border-black-10", bg: "bg-black-5", icon: "text-black-85", badge: "bg-black-5 text-black-85" },
} as const;

function iconFor(id: string) {
  if (id.startsWith("sla")) return ShieldAlert;
  if (id === "backlog") return Flame;
  if (id === "causa-principal" || id === "categoria-crecimiento") return Layers;
  if (id === "reincidencia" || id === "sobrecarga") return Users;
  if (id === "demanda") return TrendingUp;
  return Lightbulb;
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-black-10 bg-black-5 px-4 py-8 text-center">
        <Lightbulb size={20} className="mx-auto text-black-25" />
        <p className="mt-2 text-[11px] font-medium text-black-45">Sin variaciones relevantes para generar insights.</p>
        <p className="mt-0.5 text-[10px] text-black-25">
          Se requieren al menos dos periodos comparables y una base mínima de casos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((i) => {
        const tone = TONE[i.tono];
        const Icon = iconFor(i.id);
        return (
          <article key={i.id} className={cn("rounded-xl border p-3", tone.border, tone.bg)}>
            <div className="flex items-start gap-2">
              <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/80", tone.icon)}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[11.5px] font-semibold text-black-85">{i.titulo}</h3>
                <p className="mt-1 text-[10.5px] leading-4 text-black-45">{i.detalle}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-black/5 pt-2">
              <span className={cn("rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold", tone.badge)}>{i.magnitud}</span>
              <span className="text-[8.5px] text-black-25">{i.indicador}</span>
              <span className="ml-auto text-[8.5px] text-black-25">{i.periodo}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
