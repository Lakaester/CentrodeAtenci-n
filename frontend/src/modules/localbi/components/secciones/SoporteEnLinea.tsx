import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SeccionColapsable, fmtFecha, useHistoriaDensity } from "../HistoriaClinicaUI";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import type { Incidencia } from "../../types/localbi";
import { cn } from "@/lib/utils";

const PERIODOS: [string, string][] = [
  ["7", "7 días"],
  ["30", "30 días"],
  ["90", "90 días"],
  ["todo", "Todo"],
];

const ESTADOS_CONOCIDOS = new Set(["terminada", "en_proceso", "pendiente"]);

export function SoporteEnLinea({ data }: { data: HistoriaClinicaData }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  if (!comfortable) return <SoporteCompacto data={data} />;
  return <SoporteGerencial data={data} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Variante compacta: se conserva para /atenciones (Panel Operativo).
 * ───────────────────────────────────────────────────────────────────────────── */

function SoporteCompacto({ data }: { data: HistoriaClinicaData }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <SeccionColapsable
      title="Soporte en Línea"
      badge={
        <span className="flex items-center gap-1.5">
          <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
            {data.soporteLoading ? "…" : `${data.soporteTotal} incidencias`}
          </span>
        </span>
      }
    >
      <div className={comfortable ? "space-y-3" : "space-y-2"}>
        <div className={cn("flex flex-wrap items-center", comfortable ? "gap-2" : "gap-1.5")}>
          <span className={cn("uppercase tracking-wider text-black-65", comfortable ? "text-[12px]" : "text-[9px] text-black-45")}>
            Período:
          </span>
          {PERIODOS.map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => data.setPeriodoInc(v)}
              className={cn(
                "rounded-md font-medium",
                comfortable ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[9px]",
                data.periodoInc === v ? "bg-primary text-white" : "bg-black-5 text-black-65 hover:bg-black-10",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {data.soporteLoading ? (
          <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>Cargando incidencias…</p>
        ) : data.soporteTotal === 0 ? (
          <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>Sin incidencias registradas</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <SoporteKpi label="Total" value={String(data.soporteTotal)} />
              <SoporteKpi label="Abiertas" value={String(data.soporteAbiertas)} tone={data.soporteAbiertas > 0 ? "warn" : "plain"} />
              <SoporteKpi label="Cerradas" value={String(data.soporteCerradas)} />
              <SoporteKpi label="Prom. espera" value={data.soportePromEspera != null ? `${data.soportePromEspera} min` : "—"} />
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <SoporteKpi label="Prom. solución" value={data.soportePromSolucion != null ? `${data.soportePromSolucion} min` : "—"} />
              <SoporteKpi label="Última incidencia" value={data.soporteUltima} wide />
              <SoporteKpi label="Primera incidencia" value={data.soportePrimera} wide />
            </div>

            {data.soporteCategoriasOrdenadas.length > 0 && (
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Por categoría</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.soporteCategoriasOrdenadas.slice(0, 8).map(([cat, n]) => (
                    <span key={cat} className="rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                      {cat} · {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.soporteData?.porDominio.some((d) => d.resumen.porLocal.length > 0) && (
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Por local</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.soporteData.porDominio
                    .flatMap((d) => d.resumen.porLocal.map((l) => ({ ...l, dominio: d.dominio })))
                    .map((l, i) => (
                      <span key={`${l.dominio}-${l.local}-${i}`} className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-65">
                        {l.local} · {l.cantidad}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Últimas incidencias</p>
              <div className="space-y-1">
                {data.soporteData?.porDominio
                  .flatMap((d) => d.ultimasIncidencias.slice(0, 3).map((inc) => ({ ...inc, dominio: d.dominio })))
                  .sort((a, b) => new Date(b.ticket_timestamp).getTime() - new Date(a.ticket_timestamp).getTime())
                  .slice(0, 5)
                  .map((inc, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-x-2 rounded border border-black-5 bg-light px-2 py-1 text-[8px] text-black-45">
                      <span className="shrink-0 tabular-nums">{fmtFecha(inc.ticket_timestamp)}</span>
                      <span className="shrink-0 rounded bg-black-5 px-1 font-medium text-black-65">{inc.tipoproblema || "—"}</span>
                      <span className="shrink-0">{inc.estado}</span>
                      <span className="shrink-0 text-black-25">{inc.local_nombre}</span>
                      {inc.asesor_nombre && <span className="shrink-0">· {inc.asesor_nombre}</span>}
                      {inc.descripcion && <span className="min-w-0 truncate">{inc.descripcion}</span>}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </SeccionColapsable>
  );
}

function SoporteKpi({
  label,
  value,
  tone,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "warn" | "plain";
  wide?: boolean;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const cls = tone === "warn" ? "text-warning-65" : "text-black-85";
  return (
    <div className={cn("rounded-lg border border-black-10", comfortable ? "bg-white px-3 py-2.5" : "bg-light px-2 py-1.5", wide && "col-span-2")}>
      <p className={cn("leading-tight", comfortable ? "text-[20px] font-bold" : "text-sm font-semibold", cls)}>{value}</p>
      <p className={cn(comfortable ? "mt-1 text-[12px] text-black-65" : "mt-0.5 text-[9px] text-black-45")}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Variante gerencial: /clientes (comfortable).
 * ───────────────────────────────────────────────────────────────────────────── */

function SoporteGerencial({ data }: { data: HistoriaClinicaData }) {
  const ficha = data.ficha;
  const dominios = (ficha?.dominios ?? []).map((d) => d.dominio).filter(Boolean);
  const periodo = data.periodoInc;
  const periodoLabel = periodo === "todo" ? "Historial completo" : `Últimos ${periodo} días`;
  const rangoDatos = data.soporteError
    ? "No disponible"
    : data.soportePrimeraISO && data.soporteUltimaISO
      ? `${fmtFecha(data.soportePrimeraISO)} – ${fmtFecha(data.soporteUltimaISO)}`
      : "Sin datos en el período";

  return (
    <SeccionColapsable
      title="Soporte en Línea"
      titleClassName="text-[15px]"
      badge={
        <span className="inline-flex items-center rounded-md bg-black-5 px-2 py-1 text-[11px] font-medium text-black-65">
          {data.soporteLoading ? "…" : data.soporteError ? "No disponible" : `${data.soporteTotal} incidencias`}
        </span>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-black-10 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] uppercase tracking-wider text-black-45">Cliente</p>
              <p className="mt-1 truncate text-[15px] font-semibold text-black-85" title={ficha?.unidadnegocio_nombre || ficha?.unidadnegocio_id}>
                {ficha?.unidadnegocio_nombre || ficha?.unidadnegocio_id || "—"}
              </p>
              <p className="mt-1 min-w-0 break-words [overflow-wrap:anywhere] text-[12px] text-black-45">
                Alcance: {dominios.join(" · ") || "Sin dominios"}
              </p>
            </div>
            <div className="min-w-0 shrink-0 text-left sm:text-right">
              <p className="text-[12px] uppercase tracking-wider text-black-45">Período</p>
              <p className="mt-1 text-[14px] font-semibold text-black-85">{periodoLabel}</p>
              <p className="mt-1 text-[12px] text-black-45">Datos: {rangoDatos}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {PERIODOS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => data.setPeriodoInc(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  periodo === v
                    ? "bg-primary text-white"
                    : "bg-black-5 text-black-65 hover:bg-black-10",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-2 text-[12px] text-black-45">
            Fuente: <span className="font-mono">public.incidencias</span> · Fecha de creación:{" "}
            <span className="font-mono">ticket_timestamp</span>. Ventana móvil; el rango mostrado corresponde a las
            incidencias devueltas.
          </p>
          <p className="mt-1 text-[12px] text-black-45">
            La fuente no expone <span className="font-mono">localbi_id</span>; el desglose por local usa{" "}
            <span className="font-mono">local_nombre</span> y no se usa para filtrar.
          </p>
        </div>

        {data.soporteLoading ? (
          <SoporteCargando />
        ) : data.soporteError ? (
          <div className="rounded-lg border border-danger-25 bg-danger-5 p-4">
            <p className="text-[15px] font-semibold text-danger">No se pudo cargar Soporte en Línea</p>
            <p className="mt-1 text-[13px] text-danger-65">Revisa la disponibilidad del servicio e inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={() => data.soporteRefetch()}
              className="mt-3 inline-flex items-center rounded-md border border-danger-25 bg-white px-3 py-1.5 text-[13px] font-medium text-danger hover:bg-danger-5"
            >
              Reintentar
            </button>
          </div>
        ) : data.soporteTotal === 0 ? (
          <div className="rounded-lg border border-black-10 bg-white p-6 text-center">
            <p className="text-[15px] font-semibold text-black-85">Sin incidencias en el período</p>
            <p className="mt-1 text-[13px] text-black-45">
              No se encontraron registros para {dominios.join(" · ") || "los dominios del cliente"} en el período
              seleccionado.
            </p>
            {data.soportePrimeraISO && data.soporteUltimaISO && (
              <p className="mt-1 text-[12px] text-black-45">Rango de datos: {rangoDatos}.</p>
            )}
          </div>
        ) : (
          <>
            <SoporteKpis data={data} />
            <div className="grid gap-4 lg:grid-cols-2">
              <DistribucionBarras
                titulo="Por categoría"
                descripcion={`Porcentaje sobre ${data.soporteTotal} incidencias del período.`}
                items={data.soporteCategoriasDetalle.map((c) => ({
                  nombre: c.nombre,
                  cantidad: c.cantidad,
                  porcentaje: c.porcentaje,
                  sinDato: c.sinDato,
                }))}
                vacio="Sin categorías registradas."
              />
              <DistribucionBarras
                titulo="Por local"
                descripcion={`Porcentaje sobre ${data.soporteTotal} incidencias. Agrupado por local_nombre.`}
                items={data.soportePorLocalDetalle.map((l) => ({
                  nombre: l.local,
                  cantidad: l.cantidad,
                  porcentaje: l.porcentaje,
                  sinDato: l.sinDato,
                }))}
                vacio="Sin locales identificados en las incidencias."
                nota="Solo se listan locales con incidencias registradas; la fuente no permite asignar locales en cero a localbi_id."
              />
            </div>
            <UltimasIncidencias data={data} />
          </>
        )}
      </div>
    </SeccionColapsable>
  );
}

function SoporteKpis({ data }: { data: HistoriaClinicaData }) {
  const total = data.soporteTotal;
  const cerradas = data.soporteCerradas;
  const abiertas = data.soporteAbiertas;
  const enProceso = data.soporteEstados.find((e) => e.nombre === "en_proceso")?.cantidad ?? 0;
  const pendientes = data.soporteEstados.find((e) => e.nombre === "pendiente")?.cantidad ?? 0;
  const otros = data.soporteEstados.filter((e) => !ESTADOS_CONOCIDOS.has(e.nombre));
  const abiertasSub = abiertas === 0
    ? "Sin incidencias abiertas"
    : [
        `En proceso: ${enProceso}`,
        `Pendientes: ${pendientes}`,
        ...otros.map((e) => `${e.nombre}: ${e.cantidad}`),
      ].join(" · ");

  const esperaSub = data.soporteEsperaN === 0
    ? "Sin registros válidos"
    : `n=${data.soporteEsperaN}/${total}${data.soporteEsperaN < total ? ` · ${total - data.soporteEsperaN} sin dato` : ""}`;
  const solucionSub = data.soporteSolucionN === 0
    ? "Sin registros válidos"
    : `n=${data.soporteSolucionN}/${total}${data.soporteSolucionN < total ? ` · ${total - data.soporteSolucionN} sin dato` : ""}`;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiSoporte label="Total" value={String(total)} sub="Incidencias del período" tone="primary" />
      <KpiSoporte
        label="Cerradas"
        value={String(cerradas)}
        sub={`${pct(cerradas, total)}% del total · estado "terminada"`}
        tone="success"
      />
      <KpiSoporte
        label="Abiertas"
        value={String(abiertas)}
        sub={abiertasSub}
        tone={abiertas > 0 ? "warning" : "default"}
      />
      <KpiSoporte
        label="Prom. espera"
        value={data.soportePromEspera != null ? fmtMinutos(data.soportePromEspera) : "—"}
        sub={esperaSub}
      />
      <KpiSoporte
        label="Prom. solución"
        value={data.soportePromSolucion != null ? fmtMinutos(data.soportePromSolucion) : "—"}
        sub={solucionSub}
      />
      <KpiSoporte
        label="Primera incidencia"
        value={data.soportePrimeraISO ? fmtFecha(data.soportePrimeraISO) : "—"}
        sub="Fecha de creación"
      />
      <KpiSoporte
        label="Última incidencia"
        value={data.soporteUltimaISO ? fmtFecha(data.soporteUltimaISO) : "—"}
        sub="Fecha de creación"
      />
    </div>
  );
}

function KpiSoporte({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "primary" | "success" | "warning" | "default";
}) {
  const tono =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : tone === "warning"
          ? "text-warning-65"
          : "text-black-85";
  return (
    <div className="rounded-lg border border-black-10 bg-white p-4">
      <p className={cn("text-[26px] font-bold leading-tight tracking-tight", tono)}>{value}</p>
      <p className="mt-1 text-[13px] font-medium text-black-65">{label}</p>
      {sub && <p className="mt-1 text-[12px] leading-snug text-black-45">{sub}</p>}
    </div>
  );
}

function DistribucionBarras({
  titulo,
  descripcion,
  items,
  vacio,
  nota,
}: {
  titulo: string;
  descripcion: string;
  items: { nombre: string; cantidad: number; porcentaje: number; sinDato?: boolean }[];
  vacio: string;
  nota?: string;
}) {
  return (
    <div className="rounded-lg border border-black-10 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[14px] font-semibold text-black-85">{titulo}</p>
        <p className="text-[12px] text-black-45">{items.length} grupos</p>
      </div>
      <p className="mt-0.5 text-[12px] text-black-45">{descripcion}</p>

      {items.length === 0 ? (
        <p className="mt-3 text-[13px] text-black-45">{vacio}</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {items.map((item) => (
            <div key={item.nombre} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "min-w-0 break-words [overflow-wrap:anywhere] text-[13px]",
                    item.sinDato ? "text-warning-65" : "text-black-85",
                  )}
                  title={item.nombre}
                >
                  {item.nombre}
                </span>
                <span className="shrink-0 text-[13px] text-black-65 tabular-nums">
                  {item.cantidad} · {pctDistribucion(item.porcentaje)}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-black-5">
                <div
                  className={cn("h-full rounded", item.sinDato ? "bg-warning-65" : "bg-primary")}
                  style={{ width: `${Math.min(100, Math.max(0, item.porcentaje * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {nota && <p className="mt-3 text-[12px] leading-snug text-black-45">{nota}</p>}
    </div>
  );
}

function UltimasIncidencias({ data }: { data: HistoriaClinicaData }) {
  const [limite, setLimite] = useState(8);
  const todas = useMemo(() => {
    const mapa = new Map<string, Incidencia>();
    for (const d of data.soporteData?.porDominio ?? []) {
      for (const inc of d.ultimasIncidencias) {
        if (!mapa.has(inc.id_incidencia)) mapa.set(inc.id_incidencia, inc);
      }
    }
    return [...mapa.values()].sort(
      (a, b) => new Date(b.ticket_timestamp).getTime() - new Date(a.ticket_timestamp).getTime(),
    );
  }, [data.soporteData]);

  const visibles = todas.slice(0, limite);
  const puedeVerMas = todas.length > limite || limite > 8;

  return (
    <div className="rounded-lg border border-black-10 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[14px] font-semibold text-black-85">Últimas incidencias</p>
        <p className="text-[12px] text-black-45">
          Mostrando {visibles.length} de {data.soporteTotal} incidencias del período
        </p>
      </div>
      <p className="mt-0.5 text-[12px] text-black-45">
        Ordenadas por <span className="font-mono">ticket_timestamp</span> descendente. La fuente entrega hasta 20
        recientes por dominio.
      </p>

      {visibles.length === 0 ? (
        <p className="mt-3 text-[13px] text-black-45">Sin incidencias recientes para mostrar.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {visibles.map((inc) => (
            <IncidenciaCard key={inc.id_incidencia} incidencia={inc} />
          ))}
        </div>
      )}

      {puedeVerMas && (
        <button
          type="button"
          onClick={() => setLimite((v) => (v >= 20 ? 8 : 20))}
          className="mt-3 inline-flex items-center rounded-md border border-black-10 px-3 py-1.5 text-[13px] font-medium text-primary hover:bg-primary-5"
        >
          {limite >= 20 ? "Ver menos" : "Ver más recientes"}
        </button>
      )}
    </div>
  );
}

function IncidenciaCard({ incidencia }: { incidencia: Incidencia }) {
  const [abierto, setAbierto] = useState(false);
  const categoria = incidencia.tipoproblema?.trim() || "Sin categoría";
  const local = incidencia.local_nombre?.trim() || "Sin local identificado";
  const asesor = incidencia.asesor_nombre?.trim() || "Sin asesor";
  const descripcion = incidencia.descripcion?.trim() || "Sin descripción";
  const solucion = incidencia.solucion?.trim() || null;

  return (
    <div className="min-w-0 rounded-lg border border-black-10 bg-white p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="font-mono text-[16px] font-semibold text-primary">#{incidencia.id_incidencia}</span>
        <EstadoIncidenciaBadge estado={incidencia.estado} />
        <span className="rounded-md bg-black-5 px-2 py-0.5 text-[12px] font-medium text-black-65">{categoria}</span>
        <span className="min-w-0 break-words [overflow-wrap:anywhere] text-[12px] text-black-45">{local}</span>
        <span className="ml-auto shrink-0 text-[12px] text-black-45" title={incidencia.ticket_timestamp}>
          {fmtFecha(incidencia.ticket_timestamp)}
        </span>
      </div>

      <p
        className={cn(
          "mt-2 min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px] leading-relaxed text-black-85",
          !abierto && "line-clamp-3",
        )}
      >
        {descripcion}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
        <DatoTiempo label="Tiempo de espera" minutos={incidencia.tiempo_espera_minutos} />
        <DatoTiempo label="Tiempo de solución" minutos={incidencia.tiempo_solucion_minutos} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-black-45">
        <span>Asesor: <span className="font-medium text-black-65">{asesor}</span></span>
        {incidencia.categorizacion && <span>Categorización: {incidencia.categorizacion}</span>}
      </div>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {abierto ? "Ocultar detalle" : "Ver detalle"}
      </button>

      {abierto && (
        <div className="mt-2 space-y-2 border-t border-black-10 pt-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">Descripción completa</p>
            <p className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px] leading-relaxed text-black-85">
              {descripcion}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">Solución registrada</p>
            <p className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px] leading-relaxed text-black-65">
              {solucion ?? "No disponible"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function EstadoIncidenciaBadge({ estado }: { estado: string | null | undefined }) {
  const e = (estado ?? "").trim().toLowerCase();
  const tono =
    e === "terminada"
      ? "bg-success-5 text-success"
      : e === "en_proceso"
        ? "bg-primary-5 text-primary"
        : e === "pendiente"
          ? "bg-warning-5 text-warning-65"
          : "bg-black-5 text-black-45";
  const label = e === "terminada" ? "Terminada" : e === "en_proceso" ? "En proceso" : e === "pendiente" ? "Pendiente" : estado || "Sin estado";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium", tono)}>{label}</span>
  );
}

function DatoTiempo({ label, minutos }: { label: string; minutos: number | null | undefined }) {
  return (
    <div className="rounded-md border border-black-10 bg-white px-2.5 py-2">
      <p className="text-[11px] uppercase tracking-wider text-black-45">{label}</p>
      <p className={cn("mt-0.5 text-[13px] font-semibold", minutos == null ? "text-black-45" : "text-black-85")}>
        {fmtMinutos(minutos)}
      </p>
    </div>
  );
}

function SoporteCargando() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[104px] animate-pulse rounded-lg border border-black-10 bg-black-5" />
      ))}
    </div>
  );
}

function pct(valor: number, total: number): string {
  if (!total || !Number.isFinite(valor)) return "0";
  return String(Math.round((valor / total) * 100));
}

/** Porcentaje de una distribución: un decimal para no mostrar 0% en valores > 0. */
function pctDistribucion(fraccion: number): string {
  if (!Number.isFinite(fraccion)) return "0%";
  const v = Math.max(0, fraccion * 100);
  return `${v.toFixed(1).replace(/\.0$/, "")}%`;
}

function fmtMinutos(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "No disponible";
  if (v < 60) return `${Math.round(v)} min`;
  const h = Math.floor(v / 60);
  const m = Math.round(v % 60);
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d} d ${hr} h` : `${d} d`;
}
