import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { cn } from "@/lib/utils";

interface DetalleFila {
  fecha: string;
  hora: string;
  canal: string;
  subcanal: string;
  ticket: string | null;
  contacto: string | null;
  numeroCorreo: string | null;
  pais: string;
  asesor: string;
  estado: string;
  categoria: string;
  subcategoria: string;
  primeraRespuesta: number | null;
  resolucion: number | null;
  tiempoPromedio: number | null;
  dominio: string;
  tipoCliente: string | null;
}

interface DetalleResponse {
  filas: DetalleFila[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

async function fetchDetalle(params: Record<string, string>): Promise<DetalleResponse> {
  const { data } = await api.get("/dashboard/detalle", { params });
  return data.data as DetalleResponse;
}

async function fetchAllDetalle(params: Record<string, string>): Promise<DetalleFila[]> {
  const all: DetalleFila[] = [];
  const limit = 5000;
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const { data } = await api.get("/dashboard/detalle", {
      params: { ...params, pagina: String(page), limite: String(limit) },
    });
    const resp = data.data as DetalleResponse;
    all.push(...resp.filas);
    totalPages = resp.totalPaginas;
    page++;
  }
  return all;
}

const ESTADO_MAP: Record<string, string> = {
  abiertos: "abierto,open,pendiente,pending,nuevo,new",
  cerrados: "resuelto,cerrado,solved,closed",
};

const fmtDur = (min: number | null) => {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
};

const COLUMNAS: { key: keyof DetalleFila; label: string; align?: "right" }[] = [
  { key: "fecha", label: "Fecha" },
  { key: "hora", label: "Hora" },
  { key: "canal", label: "Canal" },
  { key: "subcanal", label: "Subcanal" },
  { key: "ticket", label: "Ticket" },
  { key: "contacto", label: "Contacto" },
  { key: "numeroCorreo", label: "Número / Correo" },
  { key: "pais", label: "País" },
  { key: "asesor", label: "Asesor" },
  { key: "estado", label: "Estado" },
  { key: "categoria", label: "Categoría" },
  { key: "subcategoria", label: "Subcategoría" },
  { key: "primeraRespuesta", label: "Primera respuesta", align: "right" },
  { key: "resolucion", label: "Resolución", align: "right" },
  { key: "tiempoPromedio", label: "Tiempo promedio", align: "right" },
  { key: "dominio", label: "Dominio" },
  { key: "tipoCliente", label: "Tipo cliente" },
];

const colorEstado = (e: string) =>
  e === "cerrado" ? "text-success" : e === "resuelto" ? "text-primary" : "text-black-45";

function SkeletonRows({ count, cols }: { count: number; cols: number }) {
  return (
    <tbody>
      {Array.from({ length: count }).map((_, ri) => (
        <tr key={ri} className={ri % 2 === 1 ? "bg-light" : ""}>
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-2 py-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-black-10" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function DetalleTable() {
  const { filters: globalFilters } = useFilters();
  const [localFechaHoraInicio, setLocalFechaHoraInicio] = useState("");
  const [localFechaHoraFin, setLocalFechaHoraFin] = useState("");
  const [localEstado, setLocalEstado] = useState<string>("");
  const [appliedLocal, setAppliedLocal] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [exporting, setExporting] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (globalFilters.fechaHoraInicio) p.fechaHoraInicio = globalFilters.fechaHoraInicio;
    if (globalFilters.fechaHoraFin) p.fechaHoraFin = globalFilters.fechaHoraFin;
    if (appliedLocal.fechaHoraInicio) p.fechaHoraInicio = appliedLocal.fechaHoraInicio;
    if (appliedLocal.fechaHoraFin) p.fechaHoraFin = appliedLocal.fechaHoraFin;
    if (appliedLocal.estado) p.estado = appliedLocal.estado;
    p.pagina = String(page);
    p.limite = String(limit);
    return p;
  }, [globalFilters, appliedLocal, page, limit]);

  const query = useQuery({
    queryKey: ["detalle", params],
    queryFn: () => fetchDetalle(params),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    staleTime: 15_000,
  });

  const aplicar = useCallback(() => {
    const p: Record<string, string> = {};
    if (localFechaHoraInicio) p.fechaHoraInicio = localFechaHoraInicio;
    if (localFechaHoraFin) p.fechaHoraFin = localFechaHoraFin;
    if (localEstado && ESTADO_MAP[localEstado]) p.estado = ESTADO_MAP[localEstado];
    setAppliedLocal(p);
    setPage(1);
  }, [localFechaHoraInicio, localFechaHoraFin, localEstado]);

  const limpiar = useCallback(() => {
    setLocalFechaHoraInicio("");
    setLocalFechaHoraFin("");
    setLocalEstado("");
    setAppliedLocal({});
    setPage(1);
  }, []);

  const exportar = useCallback(async () => {
    setExporting(true);
    try {
      const exportParams: Record<string, string> = {};
      if (globalFilters.fechaHoraInicio) exportParams.fechaHoraInicio = globalFilters.fechaHoraInicio;
      if (globalFilters.fechaHoraFin) exportParams.fechaHoraFin = globalFilters.fechaHoraFin;
      if (appliedLocal.fechaHoraInicio) exportParams.fechaHoraInicio = appliedLocal.fechaHoraInicio;
      if (appliedLocal.fechaHoraFin) exportParams.fechaHoraFin = appliedLocal.fechaHoraFin;
      if (appliedLocal.estado) exportParams.estado = appliedLocal.estado;
      const all = await fetchAllDetalle(exportParams);
      const ws = XLSX.utils.json_to_sheet(
        all.map((r) => ({
          Fecha: r.fecha,
          Hora: r.hora,
          Canal: r.canal,
          Subcanal: r.subcanal,
          Ticket: r.ticket ?? "",
          Contacto: r.contacto ?? "",
          "Número / Correo": r.numeroCorreo ?? "",
          País: r.pais,
          Asesor: r.asesor,
          Estado: r.estado,
          Categoría: r.categoria,
          Subcategoría: r.subcategoria,
          "Primera respuesta": r.primeraRespuesta != null ? `${r.primeraRespuesta} min` : "",
          Resolución: r.resolucion != null ? `${r.resolucion} min` : "",
          "Tiempo promedio": r.tiempoPromedio != null ? `${r.tiempoPromedio} min` : "",
          Dominio: r.dominio,
          "Tipo cliente": r.tipoCliente ?? "",
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Detalle");
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      XLSX.writeFile(wb, `Detalle_Atenciones_${ts}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [globalFilters, appliedLocal]);

  const data = query.data;
  const filas = data?.filas ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = data?.totalPaginas ?? 1;
  const loading = query.isLoading;
  const isFetching = query.isFetching;

  return (
    <div className="rounded-2xl border border-black-10 bg-white ">
      <div className="border-b border-black-10 px-5 py-4">
        <h2 className="text-base font-semibold text-black-85">Detalle de atenciones</h2>
        <p className="mt-0.5 text-xs text-black-25">
          Vista previa de las atenciones del período seleccionado.
        </p>
      </div>

      <div className="border-b border-black-10 bg-light px-5 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-medium uppercase tracking-wide text-black-45">
            Inicio
            <input type="datetime-local" value={localFechaHoraInicio.replace(" ", "T")} onChange={(e) => setLocalFechaHoraInicio(e.target.value.replace("T", " "))}
              className="mt-0.5 block rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85" />
          </label>
          <label className="text-[10px] font-medium uppercase tracking-wide text-black-45">
            Fin
            <input type="datetime-local" value={localFechaHoraFin.replace(" ", "T")} onChange={(e) => setLocalFechaHoraFin(e.target.value.replace("T", " "))}
              className="mt-0.5 block rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85" />
          </label>
          <label className="text-[10px] font-medium uppercase tracking-wide text-black-45">
            Estado
            <select value={localEstado} onChange={(e) => setLocalEstado(e.target.value)}
              className="mt-0.5 block rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85">
              <option value="">Todos</option>
              <option value="abiertos">Abiertos</option>
              <option value="cerrados">Resueltos / Cerrados</option>
            </select>
          </label>
          <button onClick={aplicar}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-[#E8620A]">
            Aplicar
          </button>
          <button onClick={limpiar}
            className="flex items-center gap-1 rounded-lg border border-black-10 bg-white px-3 py-1.5 text-xs font-medium text-black-45 hover:text-black-85">
            <RotateCcw size={12} /> Limpiar
          </button>
          <button onClick={exportar} disabled={exporting || total === 0}
            className="flex items-center gap-1 rounded-lg border border-[#F97316] bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-10 disabled:opacity-50">
            <Download size={12} /> {exporting ? "Exportando..." : "Descargar Excel"}
          </button>
        </div>
        {Object.keys(appliedLocal).length > 0 && (
          <p className="mt-2 text-[10px] text-primary">
            * Filtros locales activos. Combinados con los filtros globales del dashboard.
          </p>
        )}
      </div>

      <div className="border-b border-black-10 px-5 py-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-black-45">
            {loading ? (
              "Cargando..."
            ) : (
              <>
                Mostrando <span className="font-medium text-black-85">{filas.length}</span> de{" "}
                <span className="font-medium text-black-85">{total.toLocaleString("es-PE")}</span>{" "}
                atenciones
              </>
            )}
            {isFetching && !loading ? (
              <span className="ml-2 text-black-25">(actualizando…)</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-black-45">Registros por página:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-black-10 bg-white px-2 py-1 text-xs text-black-85"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 500 }}>
        <table className="w-full text-xs" style={{ minWidth: 1200 }}>
          <thead className="sticky top-0 z-20 bg-white">
            <tr className="border-b border-black-10">
              {COLUMNAS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-black-45",
                    col.align === "right" && "text-right",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows count={limit > 20 ? 10 : 8} cols={COLUMNAS.length} />
          ) : (
            <tbody>
              {filas.map((r, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-t border-black-5 transition-colors hover:bg-light",
                    idx % 2 === 1 && "bg-light",
                  )}
                >
                  {COLUMNAS.map((col) => {
                    const val = r[col.key];
                    const display =
                      val == null || val === ""
                        ? "—"
                        : col.key === "primeraRespuesta" || col.key === "resolucion" || col.key === "tiempoPromedio"
                          ? fmtDur(val as number)
                          : String(val);
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "whitespace-nowrap px-2 py-1.5 text-black-85",
                          col.align === "right" && "text-right tabular-nums",
                          col.key === "asesor" && "font-medium",
                          col.key === "estado" && colorEstado(r.estado),
                        )}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-black-10 px-5 py-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-black-10 bg-white px-3 py-1 text-xs font-medium text-black-45 hover:text-black-85 disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-xs text-black-45">
          Página{" "}
          <span className="font-medium text-black-85">
            {data ? page : "—"}
          </span>{" "}
          de{" "}
          <span className="font-medium text-black-85">
            {data ? totalPaginas : "—"}
          </span>
        </span>
        <button
          disabled={page >= totalPaginas}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-black-10 bg-white px-3 py-1 text-xs font-medium text-black-45 hover:text-black-85 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
