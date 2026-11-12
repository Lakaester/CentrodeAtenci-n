import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Info as InfoIcon, Store } from "lucide-react";
import { SeccionColapsable, EstadoLocalBadge, useHistoriaDensity } from "../HistoriaClinicaUI";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { normalizeDomain } from "@/domain/normalizacion";
import { cn } from "@/lib/utils";
import {
  MODULOS_LOCALBI_TOTAL,
  barraModulosLocalbi,
  etiquetaModulosLocalbi,
  numeroModulosLocalbi,
} from "../../utils/modulosLocalbi";

type LocalConDominio = HistoriaClinicaData["locales"][number];

/**
 * MÓDULOS UTILIZADOS — agregado LocalBI por local.
 *
 * Estado actual:
 * - LocalBI entrega `cantidadmodulosusa` y `porcentajemodulousa` por local.
 * - No entrega nombres de módulos, flags de contratación/habilitación/
 *   configuración ni fecha de última actividad.
 *
 * Esta sección NO inventa un desglose. Presenta el agregado con su alcance y
 * deja preparado el espacio para el catálogo real de Microservice.
 */
export function ModulosLocalbi({ data }: { data: HistoriaClinicaData }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const locales = data.locales;

  const porDominio = useMemo(() => {
    const mapa = new Map<string, LocalConDominio[]>();
    for (const local of locales) {
      const dominio = normalizeDomain(local.dominio) || local.dominio || "Sin dominio";
      if (!mapa.has(dominio)) mapa.set(dominio, []);
      mapa.get(dominio)!.push(local);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [locales]);

  return (
    <SeccionColapsable
      title="Módulos utilizados"
      badge={
        <span
          className={cn(
            "inline-flex items-center rounded-md bg-black-5 font-medium text-black-65",
            comfortable ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[8px]",
          )}
        >
          Agregado LocalBI
        </span>
      }
    >
      {locales.length === 0 ? (
        <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
          Sin locales para mostrar.
        </p>
      ) : (
        <div className={comfortable ? "space-y-3" : "space-y-2"}>
          <div className={cn("rounded-lg border border-black-10 bg-light", comfortable ? "p-3.5" : "p-2.5")}>
            <div className="flex items-start gap-2">
              <InfoIcon
                size={comfortable ? 16 : 12}
                className="mt-0.5 shrink-0 text-primary"
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <p className={cn("font-medium text-black-85", comfortable ? "text-[13px]" : "text-[9px]")}>
                  {locales.length} locales · dato agregado de LocalBI
                </p>
                <p className={cn("text-black-65", comfortable ? "text-[12px] leading-relaxed" : "text-[9px]")}>
                  LocalBI informa cuántos módulos usa cada local sobre un catálogo interno de{" "}
                  {MODULOS_LOCALBI_TOTAL}. COSE no recibe los nombres ni el estado de cada módulo.
                </p>
                <p className={cn("text-black-45", comfortable ? "text-[12px] leading-relaxed" : "text-[9px]")}>
                  Este indicador no confirma contratación, habilitación, configuración ni uso efectivo.
                  El detalle por módulo se incorporará cuando Microservice exponga el catálogo por local.
                </p>
                <details className="group">
                  <summary
                    className={cn(
                      "cursor-pointer select-none font-medium text-primary marker:content-none",
                      comfortable ? "text-[12px]" : "text-[9px]",
                    )}
                  >
                    ¿Cómo se calcula?
                  </summary>
                  <p className={cn("mt-1 text-black-65", comfortable ? "text-[12px] leading-relaxed" : "text-[9px]")}>
                    El porcentaje que entrega LocalBI equivale a{" "}
                    <span className="font-mono">cantidad / {MODULOS_LOCALBI_TOTAL} × 100</span>. COSE muestra
                    el valor de la fuente y usa la misma base solo para la barra. No se recalcula el
                    porcentaje ni se infiere el catálogo.
                  </p>
                </details>
              </div>
            </div>
          </div>

          {porDominio.map(([dominio, localesDominio]) => (
            <div key={dominio}>
              {porDominio.length > 1 && (
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Store size={comfortable ? 14 : 10} className="shrink-0 text-primary" aria-hidden />
                  <span
                    className={cn(
                      "min-w-0 break-words [overflow-wrap:anywhere] font-mono text-primary",
                      comfortable ? "text-[12px]" : "text-[9px]",
                    )}
                  >
                    {dominio}
                  </span>
                  <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
                    ({localesDominio.length} locales)
                  </span>
                </div>
              )}
              <div className="overflow-hidden rounded-lg border border-black-10">
                {localesDominio.map((local) => (
                  <ModuloLocalRow key={`${dominio}-${local.localbi_id}`} local={local} />
                ))}
              </div>
            </div>
          ))}

          <p className={cn("text-black-45", comfortable ? "text-[11px]" : "text-[8px] text-black-25")}>
            Fuente: LocalBI · Historia Clínica. El desglose por módulo no está disponible en el contrato actual.
          </p>
        </div>
      )}
    </SeccionColapsable>
  );
}

function ModuloLocalRow({ local }: { local: LocalConDominio }) {
  const [abierto, setAbierto] = useState(false);
  const comfortable = useHistoriaDensity() === "comfortable";
  const cantidad = numeroModulosLocalbi(local.cantidadmodulosusa);
  const porcentaje = numeroModulosLocalbi(local.porcentajemodulousa);
  const tieneDatos = cantidad != null || porcentaje != null;
  const barra = barraModulosLocalbi(cantidad, porcentaje);
  const nombre = local.nombre || local.localbi_id;

  return (
    <div className="border-b border-black-10 last:border-b-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={`Ver detalle de módulos de ${nombre}`}
        className={cn(
          "flex w-full min-w-0 items-center gap-3 text-left hover:bg-light",
          comfortable ? "px-4 py-3" : "px-2.5 py-2",
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium text-black-85",
              comfortable ? "text-[14px]" : "text-[10px]",
            )}
            title={nombre}
          >
            {nombre}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <EstadoLocalBadge estado={local.estado} />
            {local.plan && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md bg-black-5 text-black-65",
                  comfortable ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[8px]",
                )}
              >
                {local.plan}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {tieneDatos ? (
            <>
              <div
                className={cn(
                  "overflow-hidden rounded bg-black-5",
                  comfortable ? "h-2 w-28" : "h-1.5 w-20",
                )}
                role="img"
                aria-label={`${etiquetaModulosLocalbi(cantidad, porcentaje)} módulos reportados por LocalBI`}
              >
                <div className="h-full rounded bg-primary" style={{ width: `${barra}%` }} />
              </div>
              <span
                className={cn(
                  "text-right tabular-nums text-black-65",
                  comfortable ? "w-28 text-[12px]" : "w-20 text-[9px]",
                )}
              >
                {etiquetaModulosLocalbi(cantidad, porcentaje)}
              </span>
            </>
          ) : (
            <span className={cn("text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
              No disponible
            </span>
          )}
          {abierto ? (
            <ChevronDown size={comfortable ? 14 : 10} className="shrink-0 text-black-45" aria-hidden />
          ) : (
            <ChevronRight size={comfortable ? 14 : 10} className="shrink-0 text-black-45" aria-hidden />
          )}
        </div>
      </button>

      {abierto && <ModuloLocalDetalle cantidad={cantidad} porcentaje={porcentaje} />}
    </div>
  );
}

function ModuloLocalDetalle({
  cantidad,
  porcentaje,
}: {
  cantidad: number | null;
  porcentaje: number | null;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";

  return (
    <div
      className={cn(
        "border-t border-black-10 bg-white",
        comfortable ? "px-4 py-3.5" : "px-2.5 py-2.5",
      )}
    >
      <p
        className={cn(
          "font-semibold uppercase tracking-wider text-black-45",
          comfortable ? "text-[11px]" : "text-[8px]",
        )}
      >
        Detalle por módulo
      </p>
      <p className={cn("mt-1 font-medium text-black-85", comfortable ? "text-[13px]" : "text-[9px]")}>
        No disponible en esta fuente.
      </p>
      <p className={cn("mt-1 text-black-65", comfortable ? "text-[12px] leading-relaxed" : "text-[9px]")}>
        LocalBI solo entrega el agregado{" "}
        <span className="font-mono">
          {cantidad ?? "—"}/{MODULOS_LOCALBI_TOTAL} · {porcentaje != null ? `${Math.round(porcentaje)}%` : "—"}
        </span>
        . No informa nombres de módulos, contratación, habilitación, configuración ni última actividad.
      </p>

      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        <DatoNoDisponible label="Contratado" />
        <DatoNoDisponible label="Habilitado" />
        <DatoNoDisponible label="Configurado" />
        <DatoNoDisponible label="Utilizado" />
        <DatoNoDisponible label="Última actividad" />
      </div>

      <p className={cn("mt-2 text-black-45", comfortable ? "text-[11px] leading-relaxed" : "text-[8px]")}>
        El catálogo real y estos estados se incorporarán cuando Microservice exponga el contrato por{" "}
        <span className="font-mono">localbi_id</span>. No se infieren desde el plan, tickets o tareas.
      </p>
    </div>
  );
}

function DatoNoDisponible({ label }: { label: string }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-black-10 bg-white px-2 py-1">
      <span className={cn("text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>{label}</span>
      <span className={cn("font-medium text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
        No disponible
      </span>
    </div>
  );
}
