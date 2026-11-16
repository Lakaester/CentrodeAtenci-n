import { ChevronRight, ClipboardList, Inbox, UserRound } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { SeguimientoCaso } from "@/modules/clientes-seguimiento/types";
import {
  ESTADO_UI,
  fmtDuracion,
  fmtFechaHora,
  fmtVariacion,
  motivoClase,
} from "@/modules/clientes-seguimiento/utils";
import { EstadoBadge } from "./EstadoBadge";

function SlaBar({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-black-25">—</span>;
  const tone = pct > 30 ? "bg-danger" : pct > 15 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-black-10">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      <span className={cn("w-10 text-right text-xs tabular-nums", pct > 30 ? "text-danger" : "text-black-65")}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export function CasosTable({
  rows,
  loading,
  onOpen,
  onGestionar,
}: {
  rows: SeguimientoCaso[];
  loading: boolean;
  onOpen: (id: string) => void;
  onGestionar: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border border-black-10 bg-white p-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-black-5" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="Sin casos en esta vista"
        description="Genera el lote de la semana o cambia los filtros para ver el backlog y los casos de otros períodos."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black-10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-black-5/70 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
            <tr>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5">Asesor</th>
              <th className="px-3 py-2.5">Señales</th>
              <th className="px-3 py-2.5 text-right">Atenc.</th>
              <th className="px-3 py-2.5 text-right">Variación</th>
              <th className="px-3 py-2.5 text-right">Reinc.</th>
              <th className="px-3 py-2.5 text-right">Tiempo prom.</th>
              <th className="px-3 py-2.5 text-right">Incumpl. SLA</th>
              <th className="px-3 py-2.5">Último contacto</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const estadoUi = ESTADO_UI[c.estado];
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="cursor-pointer border-t border-black-5 align-top transition-colors hover:bg-primary-5/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", estadoUi.dot)} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate font-medium text-black-85">
                          {c.cliente}
                          <ChevronRight size={12} className="text-black-25" />
                        </p>
                        <p className="mt-0.5 text-[11px] text-black-45">
                          {c.semanaDeteccion} · {c.diasSinContacto === 0 ? "hoy" : `${c.diasSinContacto} días sin contacto`}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <EstadoBadge estado={c.estado} />
                  </td>

                  <td className="px-3 py-3">
                    {c.asesorNombre ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-black-65">
                        <UserRound size={12} className="text-black-25" />
                        {c.asesorNombre}
                      </span>
                    ) : (
                      <span className="text-xs text-black-25">Sin asignar</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex max-w-[260px] flex-wrap items-center gap-1">
                      <Badge variant="default" className="tabular-nums">
                        {c.senales} / 4
                      </Badge>
                      {c.motivos.slice(0, 2).map((m) => (
                        <span
                          key={m}
                          title={m}
                          className={cn("max-w-[150px] truncate rounded px-1.5 py-0.5 text-[10px] font-medium", motivoClase(m))}
                        >
                          {m.replace("Incumplimiento SLA > 30%", "SLA")
                            .replace("Tiempo promedio > 24 h", "Tiempo")
                            .replace("Aumento de demanda ≥ 2×", "Aumento")
                            .replace("Reincidencia ≥ 4 tickets en una subcategoría", "Reincidencia")}
                        </span>
                      ))}
                      {c.motivos.length > 2 && (
                        <span
                          className="rounded bg-black-5 px-1.5 py-0.5 text-[10px] text-black-45"
                          title={c.motivos.join(" · ")}
                        >
                          +{c.motivos.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right tabular-nums text-black-85">
                    {c.total}
                    {c.totalAnterior > 0 && (
                      <span className="block text-[10px] text-black-25">antes {c.totalAnterior}</span>
                    )}
                  </td>

                  <td
                    className={cn(
                      "px-3 py-3 text-right text-xs tabular-nums",
                      c.variacionPct == null
                        ? "text-black-25"
                        : c.variacionPct > 0
                          ? "text-primary"
                          : "text-black-45",
                    )}
                  >
                    {fmtVariacion(c.variacionPct)}
                  </td>

                  <td className="px-3 py-3 text-right text-xs tabular-nums text-black-65">
                    {c.reincidenciaMax > 0 ? (
                      <span title={c.subcategoriaRecurrente ?? undefined}>
                        {c.reincidenciaMax}
                        <span className="ml-0.5 text-[10px] text-black-25">tickets</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-3 py-3 text-right text-xs tabular-nums text-black-65">
                    {fmtDuracion(c.tiempoPromedio)}
                  </td>

                  <td className="px-3 py-3">
                    <SlaBar pct={c.pctIncumple} />
                  </td>

                  <td className="px-3 py-3">
                    {c.contactoAt ? (
                      <div>
                        <p className="text-xs text-black-65">{fmtFechaHora(c.contactoAt)}</p>
                        {c.proximoContactoAt && (
                          <p className="mt-0.5 text-[10px] text-warning">
                            Próx. {fmtFechaHora(c.proximoContactoAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-black-25">Sin contacto</span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGestionar(c.id);
                      }}
                    >
                      <ClipboardList size={12} /> Gestionar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
