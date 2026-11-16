import { Archive, CheckCircle2, Clock3, PhoneOutgoing, TriangleAlert } from "lucide-react";
import { KpiCard } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import type { SeguimientoResumen } from "@/modules/clientes-seguimiento/types";
import { fmtMes } from "@/modules/clientes-seguimiento/utils";

export function SeguimientoKpis({
  data,
  onVerBacklog,
}: {
  data: SeguimientoResumen | undefined;
  onVerBacklog: () => void;
}) {
  const k = data?.kpis;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<PhoneOutgoing size={18} />}
        label="Por contactar"
        value={String(k?.porContactar ?? 0)}
        hint="Casos de esta semana sin contacto"
      />
      <KpiCard
        icon={<Clock3 size={18} />}
        label="Con pendientes"
        value={String(k?.conPendientes ?? 0)}
        hint={
          k?.backlogVencidos
            ? `${k.backlogVencidos} con próximo contacto vencido`
            : "Contactados con acción abierta"
        }
        color={k?.conPendientes ? "text-warning" : undefined}
      />
      <KpiCard
        icon={<CheckCircle2 size={18} />}
        label="Finalizados"
        value={String(k?.finalizados ?? 0)}
        hint="Cerrados en el mes seleccionado"
        color="text-success"
      />

      <button
        type="button"
        onClick={onVerBacklog}
        className={cn(
          "group rounded-2xl border p-5 text-left transition-colors",
          k?.backlog
            ? "border-warning/40 bg-warning-5 hover:bg-warning-10"
            : "border-black-10 bg-white hover:bg-light",
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-warning">
              <Archive size={14} /> Backlog
            </p>
            <p className={cn("mt-1.5 text-2xl font-bold tracking-tight", k?.backlog ? "text-warning" : "text-black-85")}>
              {k?.backlog ?? 0}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            {k?.backlogVencidos ? <TriangleAlert size={18} /> : <Archive size={18} />}
          </div>
        </div>

        {data?.backlogPorPeriodo?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.backlogPorPeriodo.slice(-3).map((p) => (
              <span key={p.periodo} className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-black-65">
                {fmtMes(p.periodo)}: {p.total}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-black-25">Sin casos pendientes de meses anteriores</p>
        )}

        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-warning group-hover:underline">
          Ver backlog <span aria-hidden>→</span>
        </span>
      </button>
    </div>
  );
}

export function SeguimientoPulso({
  data,
  onFiltrar,
}: {
  data: SeguimientoResumen | undefined;
  onFiltrar: (senal: string) => void;
}) {
  if (!data?.porSenal?.length) return null;
  const max = Math.max(...data.porSenal.map((s) => s.total), 1);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black-10 bg-white px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">
        Pulso de señales
      </span>
      {data.porSenal.map((s) => (
        <button
          key={s.senal}
          type="button"
          onClick={() => onFiltrar(s.senal)}
          className="group flex items-center gap-2 rounded-full border border-black-10 px-2.5 py-1 text-[11px] text-black-65 hover:border-primary hover:text-primary"
          title={`${s.senal}: ${s.total} casos abiertos`}
        >
          <span className="max-w-[220px] truncate">{s.senal}</span>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-black-5">
            <span
              className="block h-full rounded-full bg-primary/70 group-hover:bg-primary"
              style={{ width: `${Math.max(8, (s.total / max) * 100)}%` }}
            />
          </span>
          <b className="tabular-nums text-black-85 group-hover:text-primary">{s.total}</b>
        </button>
      ))}
    </div>
  );
}
