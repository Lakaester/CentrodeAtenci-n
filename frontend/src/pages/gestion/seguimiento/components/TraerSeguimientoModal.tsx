import { useEffect, useState } from "react";
import { CheckCircle2, Plus, RefreshCw, Users, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCandidatos } from "@/modules/clientes-seguimiento/hooks";
import type { SeguimientoCandidato } from "@/modules/clientes-seguimiento/types";
import {
  ESTADO_UI,
  fmtFecha,
  fmtVariacion,
  motivoClase,
} from "@/modules/clientes-seguimiento/utils";
import { cn } from "@/lib/utils";

function SenalesBadge({ c }: { c: SeguimientoCandidato }) {
  return <Badge variant="default" className="tabular-nums">{c.senales} / 4</Badge>;
}

export function TraerSeguimientoModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (claves: string[]) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const { data, isLoading, isError } = useCandidatos(open);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      return;
    }
    if (data?.rows) {
      setSelected(new Set(data.rows.filter((r) => !r.yaEnSeguimiento).map((r) => r.clave)));
    }
  }, [open, data?.rows]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  function toggle(clave: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });
  }

  function toggleTodos() {
    if (!data?.rows) return;
    if (selected.size === data.rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.rows.map((r) => r.clave)));
    }
  }

  const total = data?.rows.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-black/30" onClick={() => !loading && onClose()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Traer clientes a seguimiento"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-black-10 px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Users size={13} /> Clientes que requieren seguimiento
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-black-85">Traer a seguimiento</h2>
            <p className="mt-0.5 text-xs text-black-45">
              Misma regla del reporte Clientes. Ventana de 30 días
              {data ? `: ${fmtFecha(data.desde)} → ${fmtFecha(data.hasta)}` : "."}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} aria-label="Cerrar">
            <X size={18} />
          </Button>
        </header>

        <div className="shrink-0 border-b border-black-5 bg-black-5/40 px-5 py-2.5 text-xs text-black-65">
          {isLoading ? (
            "Calculando candidatos…"
          ) : (
            <>
              <b>{total}</b> candidatos · <b>{selected.size}</b> seleccionados ·
              {" "}
              {data?.rows.filter((r) => r.yaEnSeguimiento).length ?? 0} ya están en seguimiento.
              Los ya existentes se actualizan sin duplicar el caso.
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-black-5" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-danger/30 bg-danger-5 px-3 py-2 text-xs text-danger">
              No se pudieron calcular los candidatos. Revisa la conexión con el backend.
            </div>
          )}

          {!isLoading && !isError && total === 0 && (
            <EmptyState
              icon={CheckCircle2}
              title="Sin clientes que requieran seguimiento"
              description="La ventana evaluada no tiene clientes con al menos 3 atenciones y 2 señales."
            />
          )}

          {!isLoading && !isError && total > 0 && (
            <div className="overflow-hidden rounded-xl border border-black-10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-black-5/70 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label="Seleccionar todos"
                          checked={selected.size === total}
                          onChange={toggleTodos}
                          className="h-4 w-4 accent-primary"
                        />
                      </th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Señales</th>
                      <th className="px-3 py-2 text-right">Atenc.</th>
                      <th className="px-3 py-2 text-right">Variación</th>
                      <th className="px-3 py-2">Motivos</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.rows.map((c) => (
                      <tr
                        key={c.clave}
                        className={cn(
                          "cursor-pointer border-t border-black-5 align-top hover:bg-primary-5/30",
                          selected.has(c.clave) && "bg-primary-5/20",
                        )}
                        onClick={() => toggle(c.clave)}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(c.clave)}
                            onChange={() => toggle(c.clave)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Seleccionar ${c.cliente}`}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-black-85">{c.cliente}</p>
                          <p className="text-[10px] text-black-45">Antes: {c.totalAnterior} atenciones</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <SenalesBadge c={c} />
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-black-85">{c.total}</td>
                        <td className="px-3 py-2.5 text-right text-xs tabular-nums text-black-65">
                          {fmtVariacion(c.variacionPct)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {c.motivos.map((m) => (
                              <span key={m} className={cn("rounded px-1.5 py-0.5 text-[10px]", motivoClase(m))}>
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {c.yaEnSeguimiento ? (
                            <Badge variant={ESTADO_UI[c.estadoCaso ?? "sin_seguimiento"].badge}>
                              Ya en seguimiento
                            </Badge>
                          ) : (
                            <span className="text-xs text-black-25">Nuevo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-danger/30 bg-danger-5 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black-10 px-5 py-3">
          <p className="text-xs text-black-45">
            {selected.size > 0 ? (
              <>
                Se generará el lote con <b>{selected.size}</b> caso{selected.size === 1 ? "" : "s"}.
              </>
            ) : (
              "Selecciona al menos un cliente."
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={() => onConfirm(Array.from(selected))}
              loading={loading}
              disabled={selected.size === 0}
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              Generar lote
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
