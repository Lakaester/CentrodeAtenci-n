import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Clock,
  Flame,
  Inbox,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { CasoActividad, CasoAlerta, GerencialResponse } from "../dto/dashboard.dto";
import { fmtDateShort, fmtInt, fmtMin } from "../utils/format";
import { cn } from "@/lib/utils";

interface Props {
  alertas: GerencialResponse["alertas"];
  actividad: GerencialResponse["actividad"];
  onOpenCase: (caso: CasoAlerta) => void;
}

type Tab = "criticos" | "fueraSla" | "proximos" | "antiguos";
type ActivityTab = "recientes" | "cierres" | "derivaciones";

const TABS: { id: Tab; label: string; icon: typeof Flame }[] = [
  { id: "criticos", label: "Críticos >72 h", icon: Flame },
  { id: "fueraSla", label: "Fuera de SLA", icon: TriangleAlert },
  { id: "proximos", label: "Próximos a vencer", icon: Clock },
  { id: "antiguos", label: "Antiguos >7 d", icon: Inbox },
];

function CaseRow({ caso, onOpen }: { caso: CasoAlerta; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-2 rounded-lg border border-black-5 bg-white px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary-5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] font-semibold text-black-85">#{caso.ticketId ?? "—"}</span>
          <span className="rounded bg-black-5 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-black-85">
            {caso.canal}
          </span>
          <span className="truncate text-[9.5px] text-black-25">{caso.asesor}</span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-black-45">{caso.categoria}</p>
        <p className="mt-0.5 text-[9px] text-black-25">
          {fmtDateShort(caso.fecha)} · antigüedad {fmtMin(caso.edadMin)} · 1ª resp. {fmtMin(caso.primera)}
        </p>
      </div>
      <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-black-25 group-hover:text-primary" />
    </button>
  );
}

function ActivityRow({ item }: { item: CasoActividad }) {
  const tone =
    item.estado === "cerrado" || item.estado === "resuelto"
      ? "bg-success-5 text-success"
      : item.estado === "abierto"
        ? "bg-primary-5 text-warning"
        : "bg-black-5 text-black-45";
  return (
    <div className="flex items-start gap-2 border-b border-black-5 py-1.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-black-85">#{item.ticketId ?? "—"}</span>
          <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase", tone)}>{item.estado}</span>
        </div>
        <p className="mt-0.5 truncate text-[9.5px] text-black-45">
          {item.categoria} · {item.canal} · {item.asesor}
        </p>
      </div>
      <span className="shrink-0 text-[9px] text-black-25">{fmtDateShort(item.fecha)}</span>
    </div>
  );
}

export function ControlPanel({ alertas, actividad, onOpenCase }: Props) {
  const [tab, setTab] = useState<Tab>("criticos");
  const [activityTab, setActivityTab] = useState<ActivityTab>("recientes");

  const filtered = useMemo(() => {
    const flag: Record<Tab, keyof CasoAlerta> = {
      criticos: "critico",
      fueraSla: "fueraSla",
      proximos: "proximo",
      antiguos: "antiguo",
    };
    return alertas.casos.filter((c) => c[flag[tab]] === true).slice(0, 8);
  }, [alertas.casos, tab]);

  const activity = actividad[activityTab];

  const summary = [
    { label: "Backlog", value: alertas.resumen.backlog, tone: "text-black-85", bg: "bg-black-5", tab: null },
    { label: "Críticos", value: alertas.resumen.criticos, tone: "text-danger", bg: "bg-danger-5", tab: "criticos" as Tab },
    { label: "Fuera SLA", value: alertas.resumen.fueraSla, tone: "text-warning", bg: "bg-warning-5", tab: "fueraSla" as Tab },
    { label: "Próximos", value: alertas.resumen.proximos, tone: "text-primary", bg: "bg-primary-5", tab: "proximos" as Tab },
    { label: "Antiguos", value: alertas.resumen.antiguos, tone: "text-black-45", bg: "bg-light", tab: "antiguos" as Tab },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
      <div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summary.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => s.tab && setTab(s.tab)}
              className={cn(
                "rounded-lg border border-black-5 px-2.5 py-2 text-left transition-colors",
                s.bg,
                s.tab ? "hover:border-primary/40" : "cursor-default",
                tab === s.tab && "ring-1 ring-primary/50",
              )}
            >
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-black-25">{s.label}</p>
              <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", s.tone)}>{fmtInt(s.value)}</p>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const count =
              t.id === "criticos"
                ? alertas.resumen.criticos
                : t.id === "fueraSla"
                  ? alertas.resumen.fueraSla
                  : t.id === "proximos"
                    ? alertas.resumen.proximos
                    : alertas.resumen.antiguos;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary-5 text-primary"
                    : "border-black-10 bg-white text-black-45 hover:bg-light",
                )}
              >
                <Icon size={11} /> {t.label}
                <span className="rounded-full bg-white/70 px-1 text-[8.5px] tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 max-h-[330px] space-y-1.5 overflow-y-auto pr-0.5">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black-10 bg-black-5 py-8 text-center text-[10px] text-black-25">
              No hay casos en esta categoría para los filtros aplicados.
            </p>
          ) : (
            filtered.map((c) => (
              <CaseRow key={`${c.ticketId}-${c.fecha}-${c.hora}`} caso={c} onOpen={() => onOpenCase(c)} />
            ))
          )}
        </div>
        <p className="mt-2 text-[9px] leading-4 text-black-25">
          Se muestran hasta 8 casos por categoría. La lista completa se obtiene al filtrar en Atenciones o Reportes.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-black-5 bg-black-5 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold text-black-85">Actividad reciente</h3>
            <div className="flex gap-1">
              {(
                [
                  ["recientes", "Recientes"],
                  ["cierres", "Cierres"],
                  ["derivaciones", "Derivaciones"],
                ] as [ActivityTab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActivityTab(id)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-medium",
                    activityTab === id ? "bg-primary text-white" : "text-black-45 hover:bg-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {activity.length === 0 ? (
            <p className="py-5 text-center text-[10px] text-black-25">Sin movimientos para mostrar.</p>
          ) : (
            <div>{activity.slice(0, 6).map((item) => <ActivityRow key={`${item.ticketId}-${item.hora}`} item={item} />)}</div>
          )}
        </div>

        <div className="rounded-xl border border-black-5 bg-white p-3">
          <h3 className="mb-2 text-[11px] font-semibold text-black-85">Acceso rápido</h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {[
              { to: "/atenciones", label: "Atenciones pendientes", icon: Inbox },
              { to: "/reportes", label: "Reportes operativos", icon: BarChart3 },
              { to: "/reportes/clientes", label: "Reincidencias", icon: Users },
              { to: "/gestion/quejas-devoluciones", label: "Quejas y devoluciones", icon: ClipboardList },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.to}
                  to={a.to}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black-5 px-2.5 py-2 text-[10px] font-medium text-black-85 hover:border-primary/40 hover:bg-primary-5 hover:text-primary"
                >
                  <Icon size={12} className="shrink-0 text-primary" />
                  <span className="truncate">{a.label}</span>
                  <ArrowUpRight size={10} className="ml-auto shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
