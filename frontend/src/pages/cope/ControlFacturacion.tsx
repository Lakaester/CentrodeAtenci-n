import { useMemo, useState } from "react";
import { ReceiptText, Search, Download, X, Inbox, UserCheck, History } from "lucide-react";
import { useAuth, authService } from "@/modules/auth";
import {
  useCasos, useCasoDetalle, useCategorias, useSubcategoriasDeCategoria,
  useAsignarCaso, useCambiarEstadoCaso, useCategorizarCaso, useRegistrarSnapshotCaso,
  useExportarCasos,
} from "@/modules/facturacion";
import { CasosTable } from "@/modules/facturacion/components/CasosTable";
import { CasoDrawer } from "@/modules/facturacion/components/CasoDrawer";
import { ESTADOS_ACTIVOS } from "@/modules/facturacion/components/CasoBadge";
import { TRANSICIONES_ESTADO_OPERATIVO } from "@/config/facturacionCatalog";
import { cn } from "@/lib/utils";

type Vista = "encolados" | "mis-casos" | "historial";

interface Filtros {
  desde: string;
  hasta: string;
  asesor: string;
  proveedor: string;
  dominio: string;
  ruc: string;
  estado: string;
  categoria: string;
  subcategoria: string;
  sinResponsable: boolean;
}

const VACIO: Filtros = { desde: "", hasta: "", asesor: "", proveedor: "", dominio: "", ruc: "", estado: "", categoria: "", subcategoria: "", sinResponsable: false };

function Kpi({ label, valor, alerta }: { label: string; valor: number; alerta?: boolean }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-black-45">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold", alerta ? "text-danger" : "text-black-85")}>{valor}</p>
    </div>
  );
}

export default function ControlFacturacion() {
  const { user } = useAuth();
  const puedeEditar = authService.hasPermiso(user, "Control de Facturación", "editar");
  const puedeExportar = authService.hasPermiso(user, "Control de Facturación", "exportar");

  const [vista, setVista] = useState<Vista>("encolados");
  const [f, setF] = useState<Filtros>(VACIO);
  const [casoId, setCasoId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const nombreAsesor = user?.nombre ?? "";

  const { data: todos = [], isLoading } = useCasos();
  const { data: detalle } = useCasoDetalle(casoId);
  const [catTmpId, setCatTmpId] = useState<string | null>(null);
  const categorias = useCategorias().data ?? [];
  const subcategorias = useSubcategoriasDeCategoria(catTmpId ?? detalle?.caso.categoria_id ?? null).data ?? [];

  const asignar = useAsignarCaso();
  const cambiarEstado = useCambiarEstadoCaso();
  const categorizar = useCategorizarCaso();
  const registrarSnapshot = useRegistrarSnapshotCaso();
  const exportar = useExportarCasos();

  // Lista de asesores únicos derivada de los casos (no inventar).
  const asesores = useMemo(() => [...new Set(todos.map((c) => c.asesor_actual).filter(Boolean) as string[])].sort(), [todos]);
  const proveedores = useMemo(() => [...new Set(todos.map((c) => c.proveedor).filter(Boolean) as string[])].sort(), [todos]);

  // Filtrado según pestaña + filtros activos.
  const filtrada = useMemo(() => {
    let base = todos;
    if (vista === "encolados") base = base.filter((c) => ESTADOS_ACTIVOS.includes(c.estado_operativo));
    if (vista === "mis-casos") base = base.filter((c) => c.asesor_actual === nombreAsesor);

    return base.filter((c) => {
      if (f.desde && new Date(c.primera_deteccion) < new Date(f.desde)) return false;
      if (f.hasta && new Date(c.primera_deteccion) > new Date(f.hasta + "T23:59:59")) return false;
      if (f.asesor && c.asesor_actual !== f.asesor) return false;
      if (f.proveedor && c.proveedor !== f.proveedor) return false;
      if (f.dominio && !c.dominio.toLowerCase().includes(f.dominio.toLowerCase())) return false;
      if (f.ruc && c.ruc !== f.ruc) return false;
      if (f.estado && c.estado_operativo !== f.estado) return false;
      if (f.categoria && c.categoria_nombre !== f.categoria) return false;
      if (f.subcategoria && c.subcategoria_nombre !== f.subcategoria) return false;
      if (f.sinResponsable && c.asesor_actual != null) return false;
      return true;
    });
  }, [todos, vista, f, nombreAsesor]);

  // KPIs derivados de casos reales (no inventar).
  const kpis = useMemo(() => {
    const encolados = todos.filter((c) => ESTADOS_ACTIVOS.includes(c.estado_operativo) && (c.ultimo_total ?? 0) > 0).length;
    const pendientes = todos.filter((c) => c.estado_operativo === "PENDIENTE").length;
    const enGestion = todos.filter((c) => ["EN_DIAGNOSTICO", "EN_SOLUCION", "ASIGNADO"].includes(c.estado_operativo)).length;
    const pausados = todos.filter((c) => c.estado_operativo === "PAUSADO").length;
    const resueltos = todos.filter((c) => c.estado_operativo === "RESUELTO").length;
    const sinResp = todos.filter((c) => c.asesor_actual == null && c.estado_operativo !== "RESUELTO").length;
    return { encolados, pendientes, enGestion, pausados, resueltos, sinResp };
  }, [todos]);

  const hayFiltros = Object.values(f).some((v) => (typeof v === "boolean" ? v : v !== ""));

  const descargarExcel = async () => {
    setExportando(true);
    try {
      const res = await exportar.mutateAsync({
        desde: f.desde || undefined,
        hasta: f.hasta || undefined,
        asesor: f.asesor || undefined,
        proveedor: f.proveedor || undefined,
        dominio: f.dominio || undefined,
        ruc: f.ruc || undefined,
        estado: f.estado || undefined,
        categoria: f.categoria || undefined,
        subcategoria: f.subcategoria || undefined,
      });
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "No se pudo exportar el Excel.");
    } finally {
      setExportando(false);
    }
  };

  const casoSeleccionado = detalle;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-black-10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
            <ReceiptText size={18} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-black-85">Control de Facturación</h1>
            <p className="mt-0.5 text-xs text-black-45">Gestión y seguimiento de documentos encolados.</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid shrink-0 grid-cols-3 gap-2 px-6 py-3 md:grid-cols-6">
        <Kpi label="Encolados" valor={kpis.encolados} alerta={kpis.encolados > 0} />
        <Kpi label="Pendientes" valor={kpis.pendientes} />
        <Kpi label="En gestión" valor={kpis.enGestion} />
        <Kpi label="Pausados" valor={kpis.pausados} />
        <Kpi label="Resueltos" valor={kpis.resueltos} />
        <Kpi label="Sin responsable" valor={kpis.sinResp} alerta={kpis.sinResp > 0} />
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-black-10 px-6 py-2">
        <button type="button" onClick={() => { setVista("encolados"); setCasoId(null); }}
          className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium", vista === "encolados" ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
          <Inbox size={13} /> Encolados
        </button>
        <button type="button" onClick={() => { setVista("mis-casos"); setCasoId(null); }}
          className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium", vista === "mis-casos" ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
          <UserCheck size={13} /> Mis casos
        </button>
        <button type="button" onClick={() => { setVista("historial"); setCasoId(null); }}
          className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium", vista === "historial" ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
          <History size={13} /> Historial
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          {puedeExportar && (
            <button type="button" onClick={descargarExcel} disabled={exportando}
              className="inline-flex items-center gap-1 rounded border border-black-10 bg-white px-2.5 py-1 text-[10px] font-medium text-black-65 hover:bg-light disabled:opacity-50">
              <Download size={12} /> {exportando ? "Exportando…" : "Descargar Excel"}
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="shrink-0 border-b border-black-10 px-6 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <input type="date" value={f.desde} onChange={(e) => setF((p) => ({ ...p, desde: e.target.value }))} className="h-7 rounded border border-black-10 px-1.5 text-[10px]" title="Desde" />
          <input type="date" value={f.hasta} onChange={(e) => setF((p) => ({ ...p, hasta: e.target.value }))} className="h-7 rounded border border-black-10 px-1.5 text-[10px]" title="Hasta" />
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45" />
            <input value={f.dominio} onChange={(e) => setF((p) => ({ ...p, dominio: e.target.value }))} placeholder="Dominio" className="h-7 w-40 rounded border border-black-10 bg-white py-1 pl-7 pr-2 text-[11px] focus:border-primary focus:outline-none" />
          </div>
          <input value={f.ruc} onChange={(e) => setF((p) => ({ ...p, ruc: e.target.value }))} placeholder="RUC" className="h-7 w-28 rounded border border-black-10 px-2 text-[10px] focus:border-primary focus:outline-none" />
          <select value={f.asesor} onChange={(e) => setF((p) => ({ ...p, asesor: e.target.value }))} className="h-7 rounded border border-black-10 px-1.5 text-[10px]">
            <option value="">Asesor</option>
            {asesores.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={f.proveedor} onChange={(e) => setF((p) => ({ ...p, proveedor: e.target.value }))} className="h-7 rounded border border-black-10 px-1.5 text-[10px]">
            <option value="">Proveedor</option>
            {proveedores.map((pr) => <option key={pr} value={pr}>{pr}</option>)}
          </select>
          <select value={f.estado} onChange={(e) => setF((p) => ({ ...p, estado: e.target.value }))} className="h-7 rounded border border-black-10 px-1.5 text-[10px]">
            <option value="">Estado</option>
            {Object.keys(TRANSICIONES_ESTADO_OPERATIVO).map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={f.categoria} onChange={(e) => setF((p) => ({ ...p, categoria: e.target.value }))} className="h-7 rounded border border-black-10 px-1.5 text-[10px]">
            <option value="">Categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
          <button type="button" onClick={() => setF((p) => ({ ...p, sinResponsable: !p.sinResponsable }))}
            className={cn("rounded border px-2 py-1 text-[10px]", f.sinResponsable ? "border-primary bg-primary-10 text-primary" : "border-black-10 text-black-45 hover:bg-light")}>
            Sin responsable
          </button>
          {hayFiltros && (
            <button type="button" onClick={() => setF(VACIO)} className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">
              <X size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="flex flex-1 min-h-0 flex-col bg-white">
        <CasosTable
          casos={filtrada}
          loading={isLoading}
          onAbrir={(c) => setCasoId(c.id)}
          vacioMsg={
            vista === "encolados" ? "No hay casos encolados con pendientes." :
            vista === "mis-casos" ? "No tienes casos asignados." :
            "No hay casos que coincidan con los filtros."
          }
        />
      </div>

      {/* Drawer */}
      {casoSeleccionado && (
        <CasoDrawer
          detalle={casoSeleccionado}
          puedeEditar={puedeEditar}
          asesores={asesores}
          categorias={categorias}
          subcategorias={subcategorias}
          estadosPermitidos={TRANSICIONES_ESTADO_OPERATIVO[casoSeleccionado.caso.estado_operativo] ?? []}
          onCategoriaChange={(catId) => setCatTmpId(catId || null)}
          onAsignar={async (asesorSel) => { if (casoId) await asignar.mutateAsync({ id: casoId, asesor: asesorSel }); }}
          onCambiarEstado={async (estado) => { if (casoId) await cambiarEstado.mutateAsync({ id: casoId, estado }); }}
          onCategorizar={async (catId, subId) => { if (casoId) await categorizar.mutateAsync({ id: casoId, categoriaId: catId, subcategoriaId: subId }); }}
          onRegistrarSnapshot={async (facturas, boletas) => { if (casoId) await registrarSnapshot.mutateAsync({ id: casoId, input: { facturas, boletas, origen: "MANUAL" } }); }}
          onCerrar={() => setCasoId(null)}
        />
      )}
    </div>
  );
}
