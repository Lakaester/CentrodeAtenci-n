import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { useTareabiDetalle, useTareabiLogs } from "@/modules/tareabi";
import type { TareabiHistorialEntrada } from "@/modules/tareabi";
import type { TareaIndependiente } from "../../types/localbi";
import { SeccionColapsable, useHistoriaDensity } from "../HistoriaClinicaUI";
import { config } from "@/config/env";
import { cn } from "@/lib/utils";
import {
  fmtDuracion,
  fmtFechaHora,
  resolverTiempoTarea,
  textoValido,
  tituloTarea,
  tonoEstadoTarea,
  type TiempoTarea,
} from "../../utils/tareasFechas";

/**
 * TAREAS — actividades independientes del cliente, asociadas a un local.
 *
 * No son tickets de desarrollo (TICKETS DEV) ni incidencias de Soporte.
 * - Datos base: LocalBI `tareas_sueltas` (con su local de origen).
 * - Enriquecimiento bajo demanda: Tareabi detalle + historial.
 * - La relación tarea-local se conserva por `localbi_id`.
 *
 * No se inventan fechas, responsables, estados ni relaciones.
 */

const BASE_TAREABI = config.tareabiApiUrl.replace(/\/+$/, "");

export function TareasIndependientes({ tareas }: { tareas: TareaIndependiente[] }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const [local, setLocal] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [responsable, setResponsable] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const hayAbiertas = tareas.some((t) => {
    const tipo = resolverTiempoTarea(t, Date.now());
    return tipo.kind === "transcurrido";
  });
  const ahora = useAhora(hayAbiertas);

  const locales = useMemo(() => localesUnicos(tareas), [tareas]);
  const estados = useMemo(
    () => valoresUnicos(tareas.map((t) => claveEstado(t)), etiquetaEstado),
    [tareas],
  );
  const responsables = useMemo(
    () => valoresUnicos(tareas.map((t) => claveResponsable(t)), etiquetaResponsable),
    [tareas],
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tareas.filter((t) => {
      if (local !== "todos" && t.localbi_id !== local) return false;
      if (estado !== "todos" && claveEstado(t) !== estado) return false;
      if (responsable !== "todos" && claveResponsable(t) !== responsable) return false;
      if (q) {
        const texto = `${t.tarea_id} ${t.titulo ?? ""} ${t.detalle ?? ""}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [tareas, local, estado, responsable, busqueda]);

  const resumen = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tareas) {
      const k = claveEstado(t);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  }, [tareas]);

  const hayFiltros = local !== "todos" || estado !== "todos" || responsable !== "todos" || busqueda.trim() !== "";

  const limpiar = () => {
    setLocal("todos");
    setEstado("todos");
    setResponsable("todos");
    setBusqueda("");
  };

  return (
    <SeccionColapsable
      title="TAREAS"
      badge={
        tareas.length ? (
          <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
            {tareas.length}
          </span>
        ) : undefined
      }
    >
      {tareas.length === 0 ? (
        <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
          Sin tareas independientes registradas
        </p>
      ) : (
        <div className={comfortable ? "space-y-3" : "space-y-2"}>
          <ResumenEstados
            resumen={resumen}
            estadoActivo={estado}
            onEstado={(e) => setEstado((prev) => (prev === e ? "todos" : e))}
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search size={comfortable ? 14 : 11} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título o #tarea"
                aria-label="Buscar tareas por título o identificador"
                className={cn(
                  "rounded-md border border-black-10 bg-white pl-7 pr-2 text-black-85 outline-none placeholder:text-black-25 focus:border-primary-25",
                  comfortable ? "h-8 w-56 text-[12px]" : "h-6 w-44 text-[9px]",
                )}
              />
            </label>

            <SelectFiltro
              label="Local"
              value={local}
              onChange={setLocal}
              options={[{ value: "todos", label: "Todos los locales" }, ...locales.map(([id, nombre]) => ({ value: id, label: nombre }))]}
            />
            <SelectFiltro
              label="Estado"
              value={estado}
              onChange={setEstado}
              options={[{ value: "todos", label: "Todos los estados" }, ...estados.map((e) => ({ value: e, label: etiquetaEstado(e) }))]}
            />
            <SelectFiltro
              label="Responsable"
              value={responsable}
              onChange={setResponsable}
              options={[{ value: "todos", label: "Todos los responsables" }, ...responsables.map((r) => ({ value: r, label: etiquetaResponsable(r) }))]}
            />

            {hayFiltros && (
              <button
                type="button"
                onClick={limpiar}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-black-10 text-black-65 hover:bg-light",
                  comfortable ? "h-8 px-2.5 text-[12px]" : "h-6 px-2 text-[9px]",
                )}
              >
                <X size={comfortable ? 12 : 9} /> Limpiar
              </button>
            )}
          </div>

          <p className={cn("text-black-45", comfortable ? "text-[12px]" : "text-[9px]")}>
            Mostrando <span className="font-medium text-black-65">{filtradas.length}</span> de{" "}
            <span className="font-medium text-black-65">{tareas.length}</span> tareas
          </p>

          {filtradas.length === 0 ? (
            <p className={comfortable ? "text-[13px] text-black-45" : "text-[9px] text-black-25"}>
              No hay tareas que coincidan con los filtros.
            </p>
          ) : (
            <div className={comfortable ? "space-y-2.5" : "space-y-1"}>
              {filtradas.map((t) => (
                <TareaCard key={`${t.localbi_id}-${t.tarea_id}`} tarea={t} ahora={ahora} />
              ))}
            </div>
          )}
        </div>
      )}
    </SeccionColapsable>
  );
}

function ResumenEstados({
  resumen,
  estadoActivo,
  onEstado,
}: {
  resumen: [string, number][];
  estadoActivo: string;
  onEstado: (estado: string) => void;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {resumen.map(([e, n]) => (
        <button
          key={e}
          type="button"
          onClick={() => onEstado(e)}
          title={`Filtrar por ${etiquetaEstado(e)}`}
          className={cn(
            "inline-flex items-center rounded-md font-medium transition-colors",
            comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
            tonoEstadoTarea(e),
            estadoActivo === e && "ring-2 ring-primary-25",
          )}
        >
          {etiquetaEstado(e)} · {n}
        </button>
      ))}
    </div>
  );
}

function SelectFiltro({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className={cn("shrink-0", comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45")}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "max-w-[220px] rounded-md border border-black-10 bg-white text-black-85 outline-none focus:border-primary-25",
          comfortable ? "h-8 px-2 text-[12px]" : "h-6 px-1.5 text-[9px]",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TareaCard({ tarea, ahora }: { tarea: TareaIndependiente; ahora: number }) {
  const [abierto, setAbierto] = useState(false);
  const comfortable = useHistoriaDensity() === "comfortable";

  const titulo = tituloTarea(tarea);
  const tiempo = resolverTiempoTarea(tarea, ahora);
  const href = `${BASE_TAREABI}/tareabi/${encodeURIComponent(tarea.tarea_id)}`;
  const detalleResumen = textoValido(tarea.detalle);
  const mostrarResumen = Boolean(detalleResumen && detalleResumen !== titulo);

  return (
    <div
      className={cn(
        "rounded-lg border border-black-10",
        comfortable ? "bg-white p-4" : "bg-light p-2",
        tiempo.kind === "inconsistente" && "border-warning-25",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col items-start gap-1">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir esta tarea en el microservicio de desarrollo"
            className={cn(
              "inline-flex items-center gap-1 font-mono font-semibold text-primary hover:underline",
              comfortable ? "text-[15px]" : "text-[10px]",
            )}
          >
            #{tarea.tarea_id}
            <ExternalLink size={comfortable ? 13 : 10} aria-hidden />
          </a>
          {valorTexto(tarea.sprint) && (
            <span className={cn("rounded bg-black-5 font-mono text-black-65", comfortable ? "px-1.5 py-0.5 text-[11px]" : "px-1 py-0.5 text-[8px]")}>
              {tarea.sprint}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={tarea.estado} />
            <span className={cn("min-w-0 truncate text-black-45", comfortable ? "text-[12px]" : "text-[9px]")} title={tarea.dominio || tarea.localbi_id}>
              {tarea.local_nombre || tarea.localbi_id}
            </span>
          </div>
          <p className={cn("mt-1 font-medium text-black-85", comfortable ? "line-clamp-2 text-[14px] leading-snug" : "line-clamp-2 text-[10px]")}>
            {titulo}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        <Dato label="Responsable" value={valorTexto(tarea.responsable) ?? "Sin asignar"} tono={valorTexto(tarea.responsable) ? undefined : "muted"} />
        <Dato label="Solicitud" value={fmtFechaHora(tarea.fecha_solicitud)} />
        <Dato label="Inicio" value={fmtFechaHora(tarea.fecha_inicio)} />
        <Dato label="Tentativa" value={fmtFechaHora(tarea.fecha_tentativa)} />
        <Dato label="Fin registrado" value={fmtFechaHora(tarea.fecha_fin)} />
        <Dato label="Tiempo" value={<ValorTiempo tiempo={tiempo} />} />
      </div>

      {mostrarResumen && detalleResumen && (
        <p className={cn("mt-2 line-clamp-2 text-black-65", comfortable ? "text-[13px] leading-relaxed" : "text-[9px]")}>
          {detalleResumen}
        </p>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className={cn(
            "inline-flex items-center gap-1 font-medium text-primary hover:underline",
            comfortable ? "text-[13px]" : "text-[9px]",
          )}
        >
          {abierto ? <ChevronDown size={comfortable ? 14 : 10} /> : <ChevronRight size={comfortable ? 14 : 10} />}
          {abierto ? "Ocultar detalle" : "Ver detalle"}
        </button>
      </div>

      {abierto && <TareaDetalle tarea={tarea} ahora={ahora} />}
    </div>
  );
}

function ValorTiempo({ tiempo }: { tiempo: TiempoTarea }) {
  switch (tiempo.kind) {
    case "duracion":
      return <span>Duración registrada: {fmtDuracion(tiempo.ms)}</span>;
    case "transcurrido":
      return <span>Tiempo transcurrido: {fmtDuracion(tiempo.ms)}</span>;
    case "inconsistente":
      return <span className="font-medium text-warning-65">Fechas inconsistentes</span>;
    case "sin_fin":
      return <span className="text-black-45">No disponible (sin fin registrado)</span>;
    case "sin_inicio":
      return <span className="text-black-45">No disponible (sin inicio)</span>;
    default:
      return <span className="text-black-45">No disponible</span>;
  }
}

function TareaDetalle({ tarea, ahora }: { tarea: TareaIndependiente; ahora: number }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  const detalleQuery = useTareabiDetalle(tarea.tarea_id);
  const logsQuery = useTareabiLogs(tarea.tarea_id, "0");
  const detalle = detalleQuery.data;

  const logTarea = logsQuery.data?.tareas.find((x) => x.tareabi_id === tarea.tarea_id);
  const historial: TareabiHistorialEntrada[] = logTarea?.historial ?? [];

  const referencia = textoValido(detalle?.tarea_referencia);
  const proyecto = textoValido(detalle?.tarea_proyecto);
  const categoria = textoValido(detalle?.tarea_categoria);
  const tipo = textoValido(detalle?.tarea_tipo);
  const etapa = textoValido(detalle?.tarea_etapa);
  const prioridad = textoValido(detalle?.tarea_prioridad);
  const dev = textoValido(detalle?.tarea_dev) ?? textoValido(tarea.responsable);
  const comentario = textoValido(detalle?.tarea_comentario);
  const registradoPor = textoValido(detalle?.tarea_personaregistronombre);
  const descripcion = textoValido(tarea.detalle) ?? textoValido(detalle?.tarea_descripcion);
  const conclusion = textoValido(tarea.conclusion);

  const tiempo = resolverTiempoTarea(tarea, ahora);

  return (
    <div className={cn("border-t border-black-10", comfortable ? "mt-3 space-y-3 pt-3" : "mt-2 space-y-2 pt-2")}>
      {detalleQuery.isLoading && (
        <p className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
          Consultando detalle en Tareabi…
        </p>
      )}
      {detalleQuery.isError && (
        <p className={comfortable ? "text-[12px] text-warning-65" : "text-[9px] text-warning-65"}>
          No se pudo consultar Tareabi. Se muestran los datos disponibles de LocalBI.
        </p>
      )}

      <div
        className={cn(
          "grid gap-x-6 gap-y-1.5 sm:grid-cols-2",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        {referencia && <Dato label="Referencia" value={<Referencias value={referencia} />} />}
        {proyecto && <Dato label="Proyecto" value={proyecto} />}
        {categoria && <Dato label="Categoría" value={categoria} />}
        {tipo && <Dato label="Tipo" value={tipo} />}
        {etapa && <Dato label="Etapa" value={etapa} />}
        {prioridad && <Dato label="Prioridad" value={prioridad} />}
        {dev && <Dato label="Responsable" value={dev} />}
        {registradoPor && <Dato label="Registrado por" value={registradoPor} />}
        <Dato label="Solicitud" value={fmtFechaHora(tarea.fecha_solicitud)} />
        <Dato label="Inicio" value={fmtFechaHora(tarea.fecha_inicio)} />
        <Dato label="Tentativa" value={fmtFechaHora(tarea.fecha_tentativa)} />
        <Dato label="Fin registrado" value={fmtFechaHora(tarea.fecha_fin)} />
        <Dato label="Tiempo" value={<ValorTiempo tiempo={tiempo} />} />
      </div>

      {descripcion && (
        <div>
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Descripción
          </p>
          <p className={cn("mt-1 whitespace-pre-line text-black-85", comfortable ? "text-[13px] leading-relaxed" : "text-[9px]")}>
            {descripcion}
          </p>
        </div>
      )}

      {conclusion && (
        <div>
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Conclusión
          </p>
          <p className={cn("mt-1 whitespace-pre-line text-black-65", comfortable ? "text-[13px] leading-relaxed" : "text-[9px]")}>
            {conclusion}
          </p>
        </div>
      )}

      {comentario && comentario !== conclusion && (
        <div>
          <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
            Comentario en Tareabi
          </p>
          <p className={cn("mt-1 whitespace-pre-line text-black-65", comfortable ? "text-[13px] leading-relaxed" : "text-[9px]")}>
            {comentario}
          </p>
        </div>
      )}

      <div className={cn("border-t border-black-5", comfortable ? "pt-3" : "pt-2")}>
        {logsQuery.isLoading ? (
          <p className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
            Consultando historial…
          </p>
        ) : logsQuery.isError ? (
          <p className={comfortable ? "text-[12px] text-warning-65" : "text-[9px] text-warning-65"}>
            No se pudo consultar el historial en Tareabi.
          </p>
        ) : historial.length > 0 ? (
          <Historial entradas={historial} />
        ) : (
          <p className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
            Sin historial de cambios disponible.
          </p>
        )}
      </div>

      <p className={cn("text-black-45", comfortable ? "text-[11px]" : "text-[8px] text-black-25")}>
        Tarea independiente · Sin ticket asociado
      </p>
    </div>
  );
}

function Historial({ entradas }: { entradas: TareabiHistorialEntrada[] }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className={comfortable ? "space-y-1.5" : "space-y-0.5"}>
      <p className={cn("font-semibold uppercase tracking-wider text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>
        Historial
      </p>
      {entradas.map((h, i) => (
        <div
          key={`${h.fecha ?? "sin-fecha"}-${i}`}
          className={cn(
            "flex flex-wrap items-center text-black-65",
            comfortable ? "gap-x-2.5 gap-y-1 text-[12px]" : "gap-x-2 text-[8px] text-black-45",
          )}
        >
          <span className="shrink-0 tabular-nums">{fmtFechaHora(h.fecha)}</span>
          {h.persona && <span className="shrink-0 font-medium text-black-65">{h.persona}</span>}
          {h.accion && <span className={cn("shrink-0 text-black-45", comfortable ? "text-[11px]" : "text-[8px]")}>{h.accion}</span>}
          {h.cambios.map((c, j) => (
            <span
              key={j}
              className={cn(
                "rounded bg-black-5 text-black-65",
                comfortable ? "px-1.5 py-0.5 text-[11px]" : "px-1 text-[8px] text-black-45",
              )}
            >
              {c.campo}: {textoValido(c.anterior) ?? "—"} → {textoValido(c.nuevo) ?? "—"}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Referencias({ value }: { value: string }) {
  const items = value.split(/\s+/).filter(Boolean);
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
      {items.map((x, i) =>
        /^https?:\/\//i.test(x) ? (
          <a
            key={`${x}-${i}`}
            href={x}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
            title={x}
          >
            {x}
          </a>
        ) : (
          <span key={`${x}-${i}`} className="break-all">
            {x}
          </span>
        ),
      )}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string | null | undefined }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  if (!estado) return <span className="text-black-10">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        tonoEstadoTarea(estado),
      )}
    >
      {estado}
    </span>
  );
}

function Dato({
  label,
  value,
  tono,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  tono?: "muted";
  mono?: boolean;
}) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className={cn("shrink-0", comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25")}>
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right font-medium",
          mono && "font-mono",
          tono === "muted" ? "text-black-45" : "text-black-85",
          comfortable ? "text-[13px]" : "text-[9px]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function useAhora(activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [activo]);
  return ahora;
}

function valorTexto(v: string | null | undefined): string | null {
  return textoValido(v);
}

function claveEstado(t: TareaIndependiente): string {
  return valorTexto(t.estado) ?? "__sin_estado__";
}

function claveResponsable(t: TareaIndependiente): string {
  return valorTexto(t.responsable) ?? "__sin_responsable__";
}

function etiquetaEstado(e: string): string {
  return e === "__sin_estado__" ? "Sin estado" : e;
}

function etiquetaResponsable(r: string): string {
  return r === "__sin_responsable__" ? "Sin asignar" : r;
}

function valoresUnicos(valores: string[], etiqueta: (v: string) => string): string[] {
  return [...new Set(valores)].sort((a, b) => etiqueta(a).localeCompare(etiqueta(b), "es"));
}

function localesUnicos(tareas: TareaIndependiente[]): [string, string][] {
  const m = new Map<string, string>();
  for (const t of tareas) {
    if (!m.has(t.localbi_id)) m.set(t.localbi_id, t.local_nombre || t.localbi_id);
  }
  return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
}
