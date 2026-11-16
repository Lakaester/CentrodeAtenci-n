import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FilterX, Plus, Radar, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth, authService } from "@/modules/auth";
import { Badge, Button, Checkbox, SearchInput, Select } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import {
  useCasos,
  useCrearLote,
  useResumen,
} from "@/modules/clientes-seguimiento/hooks";
import type { SeguimientoEstado, SeguimientoScope } from "@/modules/clientes-seguimiento/types";
import {
  ESTADO_UI,
  fmtFecha,
  fmtMes,
  fmtSemana,
  lunesDeSemana,
  periodoDeSemana,
  semanaActual,
  semanaDe,
} from "@/modules/clientes-seguimiento/utils";
import { CasosTable } from "./components/CasosTable";
import { CasoDrawer } from "./components/CasoDrawer";
import { SeguimientoKpis, SeguimientoPulso } from "./components/SeguimientoKpis";
import { TraerSeguimientoModal } from "./components/TraerSeguimientoModal";

const PAGE_SIZE = 25;

function errorMsg(err: unknown): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string } | null;
  return e?.response?.data?.error ?? e?.message ?? "No se pudo completar la operación.";
}

export default function SeguimientoProactivoPage() {
  const { user } = useAuth();
  const puedeCrear = authService.hasPermiso(user, "Clientes", "crear");
  const puedeEditar = authService.hasPermiso(user, "Clientes", "editar");
  const esGestor = user?.rol === "rol-admin" || user?.rol === "rol-supervisor";

  const [semana, setSemana] = useState<string>(() => semanaActual());
  const [periodo, setPeriodo] = useState<string>(() => periodoDeSemana(semanaActual()));
  const [scope, setScope] = useState<SeguimientoScope>("semana");
  const [estado, setEstado] = useState<SeguimientoEstado | "">("");
  const [asesorId, setAsesorId] = useState("");
  const [senal, setSenal] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [soloMis, setSoloMis] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [traerOpen, setTraerOpen] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [scope, estado, asesorId, senal, search, soloMis, semana, periodo]);

  const resumen = useResumen(semana, periodo);
  const lista = useCasos({
    scope,
    semana,
    periodo,
    estado: estado || undefined,
    asesorId: asesorId || undefined,
    senal: senal || undefined,
    search: search || undefined,
    soloMisCasos: soloMis,
    page,
    pageSize: PAGE_SIZE,
  });
  const crearLote = useCrearLote();

  const k = resumen.data?.kpis;

  const opcionesSemana = useMemo(() => {
    const lotes = resumen.data?.lotes ?? [];
    const set = new Map(lotes.map((l) => [
      l.semanaIso,
      `Semana ${l.semanaIso.split("-W")[1]} · ${fmtFecha(lunesDeSemana(l.semanaIso))}`,
    ]));
    if (!set.has(semana)) set.set(semana, fmtSemana(semana));
    return [...set.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [resumen.data?.lotes, semana]);

  const refetchAll = useCallback(() => {
    void resumen.refetch();
    void lista.refetch();
  }, [resumen, lista]);

  const cambiarPeriodo = (nuevo: string) => {
    setPeriodo(nuevo);
    const lotesPeriodo = (resumen.data?.lotes ?? []).filter((l) => l.periodo === nuevo);
    setSemana(lotesPeriodo.length ? lotesPeriodo[0].semanaIso : semanaDe(`${nuevo}-01`));
  };

  const cambiarSemana = (nueva: string) => {
    setSemana(nueva);
    setPeriodo(periodoDeSemana(nueva));
  };

  const limpiarFiltros = () => {
    setEstado("");
    setAsesorId("");
    setSenal("");
    setSearchInput("");
    setSearch("");
    setSoloMis(false);
    setScope("semana");
    setPage(1);
  };

  async function confirmarLote(claves: string[]) {
    setBanner(null);
    try {
      const r = await crearLote.mutateAsync({ semana, claves });
      setTraerOpen(false);
      setBanner({
        tone: "success",
        text: `Lote ${r.lote.semanaIso} generado: ${r.creados} nuevos, ${r.actualizados} actualizados${
          r.omitidos ? `, ${r.omitidos} omitidos` : ""
        }.`,
      });
    } catch (err) {
      setBanner({ tone: "danger", text: errorMsg(err) });
    }
  }

  const sinLote = !resumen.isLoading && !(resumen.data?.lotes ?? []).some((l) => l.semanaIso === semana);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-10 text-primary">
            <Radar size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-black-85">Seguimiento proactivo</h1>
            <p className="mt-0.5 text-sm text-black-45">
              Convierte las señales del reporte Clientes en casos con dueño, estado y bitácora.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-black-45">
            Mes
            <input
              type="month"
              value={periodo}
              onChange={(e) => e.target.value && cambiarPeriodo(e.target.value)}
              className="h-9 rounded-lg border border-black-10 bg-white px-2.5 text-xs text-black-85 focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-black-45">
            Semana
            <select
              value={semana}
              onChange={(e) => cambiarSemana(e.target.value)}
              className="h-9 max-w-[210px] rounded-lg border border-black-10 bg-white px-2.5 text-xs text-black-85 focus:border-primary focus:outline-none"
            >
              {opcionesSemana.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={refetchAll} loading={resumen.isFetching || lista.isFetching}>
            <RefreshCw size={14} /> Actualizar
          </Button>
          {puedeCrear && (
            <Button size="sm" onClick={() => setTraerOpen(true)}>
              <Plus size={14} /> Traer a seguimiento
            </Button>
          )}
        </div>
      </div>

      {banner && (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            banner.tone === "success"
              ? "border-success/30 bg-success-5 text-success"
              : "border-danger/30 bg-danger-5 text-danger",
          )}
        >
          <p>{banner.text}</p>
          <button type="button" onClick={() => setBanner(null)} className="text-xs underline">
            Cerrar
          </button>
        </div>
      )}

      {sinLote && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning-5 px-4 py-3 text-sm text-warning">
          <TriangleAlert size={16} />
          <span>
            La semana <b>{semana}</b> todavía no tiene lote generado. Usa “Traer a seguimiento” para
            convertir los candidatos en casos.
          </span>
        </div>
      )}

      <SeguimientoKpis
        data={resumen.data}
        onVerBacklog={() => {
          setScope("backlog");
          setPage(1);
        }}
      />

      <SeguimientoPulso data={resumen.data} onFiltrar={(s) => setSenal(s)} />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black-10 bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {([
            { id: "semana" as SeguimientoScope, label: "Semana", count: k?.totalSemana },
            { id: "mes" as SeguimientoScope, label: "Mes", count: k?.totalMes },
            { id: "backlog" as SeguimientoScope, label: "Backlog", count: k?.backlog },
            { id: "todos" as SeguimientoScope, label: "Todos", count: null },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setScope(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                scope === t.id
                  ? "border-primary bg-primary text-white"
                  : "border-black-10 bg-white text-black-45 hover:text-black-85",
              )}
            >
              {t.label}
              {t.count != null && (
                <span
                  className={cn(
                    "rounded px-1 text-[10px] tabular-nums",
                    scope === t.id ? "bg-white/20" : "bg-black-5 text-black-45",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-56">
            <SearchInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              placeholder="Buscar cliente…"
            />
          </div>
          <div className="w-40">
            <Select
              value={estado}
              onChange={(e) => setEstado(e.target.value as SeguimientoEstado | "")}
              className="h-9 text-xs"
              placeholder="Todos los estados"
              options={Object.entries(ESTADO_UI).map(([value, ui]) => ({ value, label: ui.label }))}
            />
          </div>
          <div className="w-44">
            <Select
              value={asesorId}
              onChange={(e) => setAsesorId(e.target.value)}
              className="h-9 text-xs"
              placeholder="Todos los asesores"
              options={(resumen.data?.asesores ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            />
          </div>
          <Checkbox label="Solo mis casos" checked={soloMis} onChange={setSoloMis} />
          <Button variant="ghost" size="sm" onClick={limpiarFiltros} title="Limpiar filtros">
            <FilterX size={14} />
          </Button>
        </div>
      </div>

      {senal && (
        <div className="flex items-center gap-2 text-xs text-black-45">
          <Badge variant="primary">Señal: {senal}</Badge>
          <button type="button" className="underline hover:text-primary" onClick={() => setSenal("")}>
            quitar filtro
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-black-45">
          <b className="text-black-85">{lista.data?.total ?? 0}</b> casos ·{" "}
          {scope === "semana"
            ? `${fmtSemana(semana)}`
            : scope === "mes"
              ? fmtMes(periodo)
              : scope === "backlog"
                ? "backlog acumulado"
                : "todos los períodos"}
        </p>
        {lista.isFetching && <span className="text-[11px] text-black-25">Actualizando…</span>}
      </div>

      {lista.isError ? (
        <div className="rounded-xl border border-danger/30 bg-danger-5 px-4 py-3 text-sm text-danger">
          No se pudo cargar la bandeja. {errorMsg(lista.error)}
        </div>
      ) : (
        <CasosTable
          rows={lista.data?.rows ?? []}
          loading={lista.isLoading}
          onOpen={setSelectedId}
          onGestionar={setSelectedId}
        />
      )}

      {lista.data && lista.data.total > PAGE_SIZE && (
        <Pagination
          pagina={lista.data.page}
          total={lista.data.total}
          porPagina={lista.data.pageSize}
          onCambiar={setPage}
          etiqueta="casos"
        />
      )}

      <div className="rounded-xl border border-black-10 bg-bg px-4 py-3 text-[11px] text-black-45">
        Las señales se calculan con la misma regla del reporte Clientes: al menos 3 atenciones y 2
        señales (SLA, tiempo, aumento de demanda o reincidencia). Un cliente tiene un solo caso
        abierto; al finalizarlo puede volver a entrar. El backlog reúne casos no contactados de
        semanas anteriores y pendientes vencidos. No se modifica el ticket original.
      </div>

      <CasoDrawer
        casoId={selectedId}
        onClose={() => setSelectedId(null)}
        asesores={resumen.data?.asesores ?? []}
        puedeEditar={puedeEditar}
        esGestor={esGestor}
      />

      <TraerSeguimientoModal
        open={traerOpen}
        onClose={() => setTraerOpen(false)}
        onConfirm={confirmarLote}
        loading={crearLote.isPending}
        error={crearLote.error ? errorMsg(crearLote.error) : null}
      />
    </motion.div>
  );
}
