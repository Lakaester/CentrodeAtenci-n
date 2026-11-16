import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ClipboardList, History, UserRound, X } from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useActualizarCaso,
  useDetalle,
  useGestionar,
} from "@/modules/clientes-seguimiento/hooks";
import type { SeguimientoAsesor, SeguimientoGestionInput } from "@/modules/clientes-seguimiento/types";
import {
  fmtDuracion,
  fmtFechaHora,
  fmtSemana,
  fmtVariacion,
  motivoClase,
} from "@/modules/clientes-seguimiento/utils";
import { AtencionesPanel } from "./AtencionesPanel";
import { EstadoBadge } from "./EstadoBadge";
import { GestionForm } from "./GestionForm";
import { HistorialTimeline } from "./HistorialTimeline";

type Tab = "gestion" | "atenciones" | "historial";

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-black-45">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", tone ?? "text-black-85")}>{value}</p>
    </div>
  );
}

export function CasoDrawer({
  casoId,
  onClose,
  asesores,
  puedeEditar,
  esGestor,
}: {
  casoId: string | null;
  onClose: () => void;
  asesores: SeguimientoAsesor[];
  puedeEditar: boolean;
  esGestor: boolean;
}) {
  const [tab, setTab] = useState<Tab>("gestion");
  const { data: caso, isLoading, isError } = useDetalle(casoId);
  const gestionar = useGestionar(casoId);
  const actualizar = useActualizarCaso(casoId);

  useEffect(() => {
    if (!casoId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [casoId, onClose]);

  useEffect(() => {
    setTab("gestion");
  }, [casoId]);

  if (!casoId) return null;

  const errorGestion =
    (gestionar.error as { response?: { data?: { error?: string } } } | null)?.response?.data?.error ??
    (gestionar.error as Error | null)?.message ??
    null;

  async function onSubmit(input: SeguimientoGestionInput) {
    await gestionar.mutateAsync(input);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del caso de seguimiento"
        className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col bg-white shadow-2xl"
      >
        <header className="shrink-0 border-b border-black-10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black-45">
                Caso de seguimiento
              </p>
              <h2 className="truncate text-lg font-semibold text-black-85">{caso?.cliente ?? "Cargando…"}</h2>
              {caso && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <EstadoBadge estado={caso.estado} />
                  <span className="text-[11px] text-black-45">{fmtSemana(caso.semanaDeteccion)}</span>
                  {caso.enBacklog && (
                    <Badge variant="danger" className="gap-1">
                      <AlertTriangle size={10} /> Backlog
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </Button>
          </div>

          {caso && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {esGestor ? (
                  <label className="flex items-center gap-2 text-[11px] text-black-45">
                    <UserRound size={13} /> Asesor
                    <span className="block w-52">
                      <Select
                        className="h-8 text-xs"
                        value={caso.asesorId ?? ""}
                        onChange={(e) => actualizar.mutate({ asesorId: e.target.value || null })}
                        options={[
                          { value: "", label: "Sin asignar" },
                          ...asesores.map((a) => ({ value: a.id, label: a.nombre })),
                        ]}
                      />
                    </span>
                  </label>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-black-45">
                    <UserRound size={13} />
                    {caso.asesorNombre ?? "Sin asignar"}
                  </span>
                )}
                {caso.proximoContactoAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-5 px-2 py-0.5 text-[11px] text-warning">
                    <CalendarClock size={12} /> Próximo {fmtFechaHora(caso.proximoContactoAt)}
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                <Metric label="Atenc. 30 d" value={String(caso.total)} />
                <Metric label="Variación" value={fmtVariacion(caso.variacionPct)} />
                <Metric label="Reincidencia" value={`${caso.reincidenciaMax}`} />
                <Metric label="Tiempo prom." value={fmtDuracion(caso.tiempoPromedio)} />
                <Metric
                  label="Incumpl. SLA"
                  value={caso.pctIncumple == null ? "—" : `${caso.pctIncumple.toFixed(0)}%`}
                  tone={caso.pctIncumple != null && caso.pctIncumple > 30 ? "text-danger" : undefined}
                />
                <Metric
                  label="Sin contacto"
                  value={`${caso.diasSinContacto} d`}
                  tone={caso.diasSinContacto > 14 ? "text-danger" : undefined}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {caso.motivos.map((m) => (
                  <span
                    key={m}
                    className={cn("rounded px-2 py-0.5 text-[10px] font-medium", motivoClase(m))}
                  >
                    {m}
                  </span>
                ))}
                {caso.subcategoriaRecurrente && (
                  <span className="rounded bg-black-5 px-2 py-0.5 text-[10px] text-black-65">
                    Reincide en: {caso.subcategoriaRecurrente}
                  </span>
                )}
              </div>
            </>
          )}
        </header>

        <nav role="tablist" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-black-5 px-3">
          {[
            { id: "gestion" as Tab, label: "Gestión", icon: ClipboardList, count: null },
            { id: "atenciones" as Tab, label: "Atenciones", icon: History, count: null },
            { id: "historial" as Tab, label: "Historial", icon: History, count: caso?.gestiones.length ?? null },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
                tab === id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-black-45 hover:text-black-85",
              )}
            >
              <Icon size={15} /> {label}
              {count != null && (
                <span className="rounded bg-black-5 px-1.5 py-0.5 text-[10px] tabular-nums text-black-45">
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-black-5" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-danger/30 bg-danger-5 px-3 py-2 text-xs text-danger">
              No se pudo cargar el caso. Cierra y vuelve a abrir.
            </div>
          )}

          {caso && tab === "gestion" && (
            <>
              {!puedeEditar ? (
                <div className="rounded-lg border border-black-10 bg-black-5/50 px-3 py-2 text-xs text-black-45">
                  Tienes acceso de lectura. Un asesor asignado o un supervisor puede registrar la gestión.
                </div>
              ) : (
                <GestionForm
                  key={caso.id}
                  caso={caso}
                  onSubmit={onSubmit}
                  loading={gestionar.isPending}
                  error={errorGestion}
                />
              )}
            </>
          )}

          {caso && tab === "atenciones" && <AtencionesPanel casoId={caso.id} />}
          {caso && tab === "historial" && <HistorialTimeline gestiones={caso.gestiones} />}
        </div>
      </aside>
    </div>
  );
}
