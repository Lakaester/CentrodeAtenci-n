import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useQdLista, type QdCaso } from "@/modules/quejas-devoluciones";
import { fmtFecha, fmtMoneda } from "@/modules/quejas-devoluciones/components/qdUI";
import { normalizeDomain } from "@/domain/normalizacion";
import { cn } from "@/lib/utils";

type TipoFiltro = "todos" | "queja" | "devolucion";
type CasoFiltro = "todos" | "abiertos" | "cerrados";

const TONO_ESTADO: Record<string, string> = {
  "pendiente de conciliación": "bg-warning-5 text-warning-65",
  "en negociación": "bg-primary-5 text-primary",
  "pendiente de aprobación": "bg-yellow-5 text-yellow",
  resuelto: "bg-success-5 text-success",
};

const TONO_RESULTADO: Record<string, string> = {
  "no procede": "bg-danger-5 text-danger",
  "procede 100%": "bg-success-5 text-success",
  "procede parcialmente": "bg-primary-5 text-primary",
  pendiente: "bg-warning-5 text-warning-65",
};

/**
 * Quejas y devoluciones — variante de /clientes (comfortable).
 *
 * Fuente: public.qd_casos + public.qd_caso_interacciones vía
 * GET /api/quejas-devoluciones/quejas y /devoluciones.
 *
 * No modifica la variante compacta de /atenciones. No calcula tiempos de
 * resolución ni infiere estados: muestra caso, conciliación y resultado por
 * separado.
 */
export function QdClienteHistorialCose({ dominios }: { dominios: string[] }) {
  const devolucionesQuery = useQdLista("devolucion");
  const quejasQuery = useQdLista("queja");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todos");
  const [casoFiltro, setCasoFiltro] = useState<CasoFiltro>("todos");

  const dominiosNorm = useMemo(
    () => new Set(dominios.map((d) => normalizeDomain(d)).filter((d): d is string => Boolean(d))),
    [dominios],
  );

  const casos = useMemo(() => {
    const todos = [...(devolucionesQuery.data ?? []), ...(quejasQuery.data ?? [])];
    return todos
      .filter((c) => {
        const dominio = normalizeDomain(c.dominio);
        return Boolean(dominio && dominiosNorm.has(dominio));
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [devolucionesQuery.data, quejasQuery.data, dominiosNorm]);

  const quejas = casos.filter((c) => c.tipo === "queja").length;
  const devoluciones = casos.filter((c) => c.tipo === "devolucion").length;
  const abiertos = casos.filter((c) => !c.caso_cerrado).length;
  const cerrados = casos.filter((c) => c.caso_cerrado).length;

  const filtrados = casos.filter((c) => {
    if (tipoFiltro !== "todos" && c.tipo !== tipoFiltro) return false;
    if (casoFiltro === "abiertos" && c.caso_cerrado) return false;
    if (casoFiltro === "cerrados" && !c.caso_cerrado) return false;
    return true;
  });

  const cargando = devolucionesQuery.isLoading || quejasQuery.isLoading;
  const errorAmbos = devolucionesQuery.isError && quejasQuery.isError;
  const errorParcial = devolucionesQuery.isError !== quejasQuery.isError;
  const posibleTruncamiento =
    (devolucionesQuery.data?.length ?? 0) >= 200 || (quejasQuery.data?.length ?? 0) >= 200;

  const reintentarTodo = () => {
    if (devolucionesQuery.isError) devolucionesQuery.refetch();
    if (quejasQuery.isError) quejasQuery.refetch();
  };

  if (cargando && casos.length === 0) {
    return <QdSkeleton />;
  }

  if (errorAmbos) {
    return (
      <QdEstado
        titulo="No se pudieron cargar los casos"
        detalle="La consulta de quejas y devoluciones no está disponible."
        accion="Reintentar"
        onAccion={reintentarTodo}
        tono="error"
      />
    );
  }

  if (errorParcial && casos.length === 0) {
    return (
      <QdEstado
        titulo="No se pudieron cargar todos los casos"
        detalle={`Falló la consulta de ${devolucionesQuery.isError ? "devoluciones" : "quejas"} y no hay casos disponibles de la otra consulta.`}
        accion="Reintentar"
        onAccion={reintentarTodo}
        tono="error"
      />
    );
  }

  if (casos.length === 0) {
    return (
      <QdEstado
        titulo="Sin casos de quejas o devoluciones"
        detalle="No se encontraron casos asociados a los dominios de este cliente."
        tono="vacio"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-black-10 bg-white p-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[13px] text-black-65">
            <span className="font-semibold text-black-85">{casos.length}</span>{" "}
            {casos.length === 1 ? "caso" : "casos"} ·{" "}
            <span className="font-semibold text-black-85">{quejas}</span>{" "}
            {quejas === 1 ? "queja" : "quejas"} ·{" "}
            <span className="font-semibold text-black-85">{devoluciones}</span>{" "}
            {devoluciones === 1 ? "devolución" : "devoluciones"}
          </p>
          <p className="text-[12px] text-black-45">
            {abiertos} abiertos · {cerrados} cerrados
          </p>
        </div>

        {errorParcial && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning-25 bg-warning-5 px-2.5 py-1.5">
            <p className="text-[12px] text-warning-65">
              No se pudo cargar {devolucionesQuery.isError ? "devoluciones" : "quejas"}. Se muestran los casos disponibles.
            </p>
            <button
              type="button"
              onClick={reintentarTodo}
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-black-45">Tipo</span>
          <FiltroChip activo={tipoFiltro === "todos"} onClick={() => setTipoFiltro("todos")}>
            Todos · {casos.length}
          </FiltroChip>
          <FiltroChip activo={tipoFiltro === "queja"} onClick={() => setTipoFiltro("queja")}>
            Quejas · {quejas}
          </FiltroChip>
          <FiltroChip activo={tipoFiltro === "devolucion"} onClick={() => setTipoFiltro("devolucion")}>
            Devoluciones · {devoluciones}
          </FiltroChip>
          <span className="hidden h-4 w-px bg-black-10 sm:block" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-black-45">Caso</span>
          <FiltroChip activo={casoFiltro === "todos"} onClick={() => setCasoFiltro("todos")}>
            Todos
          </FiltroChip>
          <FiltroChip activo={casoFiltro === "abiertos"} onClick={() => setCasoFiltro("abiertos")}>
            Abiertos · {abiertos}
          </FiltroChip>
          <FiltroChip activo={casoFiltro === "cerrados"} onClick={() => setCasoFiltro("cerrados")}>
            Cerrados · {cerrados}
          </FiltroChip>
        </div>
      </div>

      {posibleTruncamiento && (
        <p className="rounded-md border border-warning-25 bg-warning-5 px-2.5 py-1.5 text-[12px] text-warning-65">
          La fuente devolvió 200 casos de un tipo; el listado podría estar truncado. Se requiere filtro por dominio en el endpoint.
        </p>
      )}

      {filtrados.length === 0 ? (
        <div className="rounded-lg border border-black-10 bg-white p-4 text-center">
          <p className="text-[13px] text-black-65">No hay casos con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={() => {
              setTipoFiltro("todos");
              setCasoFiltro("todos");
            }}
            className="mt-1 text-[12px] font-medium text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((caso) => (
            <QdCasoCard key={caso.id} caso={caso} />
          ))}
        </div>
      )}
    </div>
  );
}

function QdCasoCard({ caso }: { caso: QdCaso }) {
  const [abierto, setAbierto] = useState(false);
  const motivo = caso.motivo?.trim() || caso.area?.trim() || caso.producto?.trim() || "Sin descripción";
  const dominio = normalizeDomain(caso.dominio) || caso.dominio || "Sin dominio";
  const interacciones =
    caso.total_interacciones == null
      ? "Interacciones: No disponible"
      : caso.total_interacciones === 0
        ? "Sin interacciones"
        : `${caso.total_interacciones} interacción${caso.total_interacciones === 1 ? "" : "es"}`;
  const cerrada = caso.cerrado_at ? new Date(caso.cerrado_at).getTime() : null;
  const creada = caso.created_at ? new Date(caso.created_at).getTime() : null;
  const fechasInconsistentes =
    caso.caso_cerrado && cerrada != null && creada != null && cerrada < creada;
  const montoDevuelto = fmtMonto(caso.monto_devuelto, caso.moneda);

  return (
    <article className="min-w-0 rounded-lg border border-black-10 bg-white p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-mono text-[14px] font-semibold text-primary">{caso.numero}</span>
            <Badge tono="bg-black-5 text-black-65">{caso.tipo === "devolucion" ? "Devolución" : "Queja"}</Badge>
            <Badge tono={caso.caso_cerrado ? "bg-black-5 text-black-65" : "bg-primary-5 text-primary"}>
              {caso.caso_cerrado ? "Cerrado" : "Abierto"}
            </Badge>
          </div>
          <p
            className={cn(
              "mt-1.5 min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[14px] font-semibold leading-snug text-black-85",
              !abierto && "line-clamp-3",
            )}
          >
            {motivo}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-wider text-black-45">Registrado</p>
          <p className="mt-0.5 text-[12px] text-black-65">{fmtFechaEvento(caso.created_at)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <EstadoBloque
          label="Caso"
          badge={
            <Badge tono={caso.caso_cerrado ? "bg-black-5 text-black-65" : "bg-primary-5 text-primary"}>
              {caso.caso_cerrado ? "Cerrado" : "Abierto"}
            </Badge>
          }
          detalle={
            caso.caso_cerrado
              ? `Cierre: ${caso.cerrado_at ? fmtFechaEvento(caso.cerrado_at) : "No disponible"}`
              : "Sin fecha de cierre"
          }
        />
        <EstadoBloque
          label="Conciliación"
          badge={<Badge tono={tonoEstado(caso.estado)}>{caso.estado || "Sin estado"}</Badge>}
          detalle={caso.estado ? "Estado de conciliación" : "No disponible"}
        />
        <EstadoBloque
          label="Resultado"
          badge={<Badge tono={tonoResultado(caso.resultado)}>{caso.resultado || "No disponible"}</Badge>}
          detalle={caso.resultado ? "Resultado de conciliación" : "No disponible"}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-black-45">
        <span className="min-w-0 break-words [overflow-wrap:anywhere] font-mono text-primary">{dominio}</span>
        <span>Asesor: <span className="font-medium text-black-65">{caso.asesor || "No disponible"}</span></span>
        {caso.fecha_solicitud && (
          <span>Solicitud: <span className="font-medium text-black-65">{fmtFechaSolo(caso.fecha_solicitud)}</span></span>
        )}
        <span>Actualizado: <span className="font-medium text-black-65">{fmtFecha(caso.updated_at)}</span></span>
        <span>{interacciones}</span>
        {caso.tipo === "devolucion" && (
          <span>Monto devuelto: <span className="font-medium text-black-65">{montoDevuelto}</span></span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          to={`/gestion/quejas-devoluciones?caso=${encodeURIComponent(caso.id)}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          <ExternalLink size={13} /> Abrir expediente
        </Link>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-black-65 hover:underline"
        >
          {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {abierto ? "Ocultar detalle" : "Ver detalle"}
        </button>
      </div>

      {abierto && (
        <div className="mt-3 space-y-3 border-t border-black-10 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">Descripción completa</p>
            <p className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px] leading-relaxed text-black-85">
              {motivo}
            </p>
          </div>

          {caso.observacion?.trim() && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">Observación</p>
              <p className="mt-1 whitespace-pre-line break-words [overflow-wrap:anywhere] text-[13px] leading-relaxed text-black-65">
                {caso.observacion}
              </p>
            </div>
          )}

          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <Dato label="Área" value={caso.area || "No disponible"} />
            <Dato label="Clasificación" value={caso.clasificacion || "No disponible"} />
            <Dato label="Producto" value={caso.producto || "No disponible"} />
            <Dato label="Ticket" value={caso.ticket_id || "No disponible"} mono />
            <Dato label="País" value={caso.pais || "No disponible"} />
            <Dato label="Fecha de solicitud" value={fmtFechaSolo(caso.fecha_solicitud)} />
            <Dato label="Última actualización" value={fmtFecha(caso.updated_at)} />
            <Dato label="Cerrado" value={caso.caso_cerrado ? fmtFechaEvento(caso.cerrado_at) : "No disponible"} />
            {caso.tipo === "devolucion" && (
              <>
                <Dato label="Monto pagado" value={fmtMonto(caso.monto_pagado, caso.moneda)} />
                <Dato label="Porcentaje" value={fmtPorcentaje(caso.porcentaje)} />
                <Dato label="Tipo de monto" value={caso.tipo_monto || "No disponible"} />
                <Dato label="Moneda" value={caso.moneda || "No disponible"} />
              </>
            )}
          </div>

          {fechasInconsistentes && (
            <p className="rounded-md border border-warning-25 bg-warning-5 px-2.5 py-1.5 text-[12px] text-warning-65">
              La fecha de cierre es anterior a la fecha de registro; revisar el dato en la fuente.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function EstadoBloque({
  label,
  badge,
  detalle,
}: {
  label: string;
  badge: React.ReactNode;
  detalle: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-black-10 bg-white px-2.5 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">{label}</p>
      <div className="mt-1">{badge}</div>
      <p className="mt-1 truncate text-[11px] text-black-45" title={detalle}>{detalle}</p>
    </div>
  );
}

function Dato({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="shrink-0 text-[11px] uppercase tracking-wider text-black-45">{label}</span>
      <span
        className={cn(
          "min-w-0 break-words [overflow-wrap:anywhere] text-right text-[12px] font-medium text-black-85",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Badge({ children, tono }: { children: React.ReactNode; tono: string }) {
  return (
    <span className={cn("inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[12px] font-medium", tono)}>
      {children}
    </span>
  );
}

function FiltroChip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors",
        activo ? "bg-primary text-white" : "bg-black-5 text-black-65 hover:bg-black-10",
      )}
    >
      {children}
    </button>
  );
}

function QdEstado({
  titulo,
  detalle,
  accion,
  onAccion,
  tono,
}: {
  titulo: string;
  detalle: string;
  accion?: string;
  onAccion?: () => void;
  tono: "error" | "vacio";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-6 text-center",
        tono === "error" ? "border-danger-25 bg-danger-5" : "border-black-10 bg-white",
      )}
    >
      <p className={cn("text-[14px] font-semibold", tono === "error" ? "text-danger" : "text-black-85")}>{titulo}</p>
      <p className={cn("mt-1 text-[13px]", tono === "error" ? "text-danger-65" : "text-black-45")}>{detalle}</p>
      {accion && onAccion && (
        <button
          type="button"
          onClick={onAccion}
          className="mt-3 rounded-md border border-black-10 bg-white px-3 py-1.5 text-[13px] font-medium text-primary hover:bg-primary-5"
        >
          {accion}
        </button>
      )}
    </div>
  );
}

function QdSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-lg border border-black-10 bg-black-5" />
      ))}
    </div>
  );
}

function tonoEstado(estado: string | null): string {
  return TONO_ESTADO[(estado ?? "").trim().toLowerCase()] ?? "bg-black-5 text-black-45";
}

function tonoResultado(resultado: string | null): string {
  return TONO_RESULTADO[(resultado ?? "").trim().toLowerCase()] ?? "bg-black-5 text-black-45";
}

function numero(valor: unknown): number | null {
  if (valor == null) return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const n = Number(String(valor).trim());
  return Number.isFinite(n) ? n : null;
}

function fmtMonto(valor: unknown, moneda: string | null): string {
  const n = numero(valor);
  if (n == null) return "No disponible";
  return fmtMoneda(n, moneda);
}

function fmtPorcentaje(valor: unknown): string {
  const n = numero(valor);
  return n == null ? "No disponible" : `${n}%`;
}

/** Fecha date-only (YYYY-MM-DD): no aplicar zona horaria para no desplazar el día. */
function fmtFechaSolo(valor: string | null | undefined): string {
  if (!valor) return "No disponible";
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return fmtFecha(valor);
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * created_at/cerrado_at se almacenan a medianoche UTC cuando el dato original es
 * solo fecha. En ese caso se formatea como fecha date-only para no desplazar el día
 * por la zona horaria. Si el timestamp tiene hora real, se formatea en hora local.
 */
function fmtFechaEvento(valor: string | null | undefined): string {
  if (!valor) return "No disponible";
  const m = String(valor).match(/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.0+)?Z$/);
  return m ? fmtFechaSolo(m[1]) : fmtFecha(valor);
}
