import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, HandHelping, Clock, PlayCircle, CheckCircle2, Trash2, X, Filter, UserCheck, Search, Download } from "lucide-react";
import {
  useApoyoLista, useApoyoKpis, useApoyoCrear, useApoyoActualizar,
  useApoyoCerrar, useApoyoEliminar, useApoyoAreas, useApoyoAsesores,
  useApoyoCategoriasFun, useApoyoSubcategoriasDeCategoria,
  useApoyoExportar,
  type Apoyo, type CrearApoyoInput, type ApoyoCategoria,
} from "@/modules/gestion";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAuth, authService } from "@/modules/auth";
import { normalizeDomain } from "@/domain/normalizacion";

const ESTADO_BADGE: Record<string, "warning" | "primary" | "success"> = {
  PENDIENTE: "warning",
  ACTIVO: "primary",
  CERRADO: "success",
};

const CATEGORIAS: ApoyoCategoria[] = [
  "Dudas y consultas",
  "Apoyos con clientes",
  "Manejo de casos derivado",
  "Apoyo funciones de otras áreas",
];

function extractDate(v: string | null): string {
  if (!v) return "";
  if (v.includes("T")) return v.split("T")[0];
  return v;
}

function extractTime(v: string | null): string {
  if (!v) return "";
  if (v.includes("T")) {
    const timePart = v.split("T")[1];
    return timePart.slice(0, 5);
  }
  return v.slice(0, 5);
}

function fmtFecha(v: string | null): string {
  if (!v) return "â€”";
  const d = new Date(extractDate(v) + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDuracion(min: number | null): string {
  if (min == null) return "â€”";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const HOY = new Date().toISOString().split("T")[0];

function SearchableSelect({ options, value, onChange, placeholder, disabled }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtrados = useMemo(() => {
    if (!busqueda) return options;
    const q = busqueda.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, busqueda]);

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center h-9 rounded-md border border-black-10 px-2 text-xs bg-white cursor-pointer hover:border-black-20"
        onClick={() => { if (!disabled) setOpen(!open); }}
      >
        <Search size={12} className="text-black-45 mr-1.5 shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-xs placeholder:text-black-30"
          placeholder={value || placeholder || "Buscar..."}
          value={open ? busqueda : (value || "")}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => { if (!disabled) setOpen(true); setBusqueda(""); }}
          readOnly={!open}
          disabled={disabled}
        />
        {value && !disabled && (
          <button onClick={(e) => { e.stopPropagation(); onChange(""); setBusqueda(""); }} className="text-black-45 hover:text-black-85 ml-1">
            <X size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-black-10 rounded-md shadow-lg">
          {filtrados.length === 0 ? (
            <div className="px-3 py-2 text-[10px] text-black-45">Sin resultados</div>
          ) : (
            filtrados.map((o) => (
              <button
                key={o}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-primary-5 cursor-pointer ${o === value ? "bg-primary-5 text-primary font-medium" : "text-black-85"}`}
                onClick={() => { onChange(o); setOpen(false); setBusqueda(""); }}
              >
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FiltrosBar({ filtros, onChange, onMisApoyos, misApoyos, puedeAdministrar }: {
  filtros: Record<string, string>;
  onChange: (f: Record<string, string>) => void;
  onMisApoyos: (v: boolean) => void;
  misApoyos: boolean;
  puedeAdministrar: boolean;
}) {
  const { data: areasData } = useApoyoAreas();
  const areas = areasData?.data ?? [];

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-black-45">Desde</label>
        <Input type="date" value={filtros.desde} onChange={(e) => onChange({ ...filtros, desde: e.target.value })} className="h-8 text-xs w-[140px]" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-black-45">Hasta</label>
        <Input type="date" value={filtros.hasta} onChange={(e) => onChange({ ...filtros, hasta: e.target.value })} className="h-8 text-xs w-[140px]" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-black-45">Estado</label>
        <Select
          options={[
            { value: "", label: "Todos" },
            { value: "PENDIENTE", label: "Pendiente" },
            { value: "ACTIVO", label: "Activo" },
            { value: "CERRADO", label: "Cerrado" },
          ]}
          value={filtros.estado}
          onChange={(e) => onChange({ ...filtros, estado: e.target.value })}
          className="h-8 text-xs w-[130px]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-black-45">Ãrea</label>
        <Select
          options={[{ value: "", label: "Todas" }, ...areas.map((a) => ({ value: a.nombre, label: a.nombre }))]}
          value={filtros.area}
          onChange={(e) => onChange({ ...filtros, area: e.target.value })}
          className="h-8 text-xs w-[150px]"
        />
      </div>
      {puedeAdministrar ? (
        <Button
          variant={misApoyos ? "primary" : "ghost"}
          size="sm"
          onClick={() => onMisApoyos(!misApoyos)}
        >
          <UserCheck size={14} /> {misApoyos ? "Mis Apoyos" : "Todos"}
        </Button>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary-5 rounded">
          <UserCheck size={14} /> Mis Apoyos
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={() => { onChange({ desde: HOY, hasta: HOY, estado: "", area: "" }); if (puedeAdministrar) onMisApoyos(false); }}>
        Limpiar
      </Button>
    </div>
  );
}

function FormularioApoyo({ onCancelar, onGuardar, initial }: {
  onCancelar: () => void;
  onGuardar: (input: CrearApoyoInput) => void;
  initial?: Apoyo;
}) {
  const { data: areasData } = useApoyoAreas();
  const { data: asesoresData } = useApoyoAsesores();
  const { data: catsFunData } = useApoyoCategoriasFun();
  const areas = areasData?.data ?? [];
  const asesores = asesoresData?.data ?? [];
  const categoriasFun = (catsFunData?.data ?? []).map((c) => c.categoria);

  const asesoresOptions = useMemo(() => {
    const opts = asesores.map((a) => ({ value: a.id, label: [a.nombre, a.apellido].filter(Boolean).join(" ") }));
    if (initial && initial.asesor_id && !opts.some((o) => o.value === initial.asesor_id)) {
      opts.unshift({ value: initial.asesor_id, label: initial.asesor_nombre });
    }
    return opts;
  }, [asesores, initial]);

  const [form, setForm] = useState<CrearApoyoInput>({
    asesorId: initial?.asesor_id ?? "",
    asesorNombre: initial?.asesor_nombre ?? "",
    dominio: initial?.dominio ?? "",
    clienteNombre: initial?.cliente_nombre ?? "",
    fecha: initial ? extractDate(initial.fecha) : HOY,
    horaInicio: initial ? extractTime(initial.hora_inicio) : null,
    horaFin: initial ? extractTime(initial.hora_fin) : null,
    categoria: initial?.categoria ?? "Dudas y consultas",
    subcategoriaFun: initial?.subcategoria_fun ?? "",
    subSubcategoriaFun: initial?.sub_subcategoria_fun ?? "",
    area: initial?.area ?? "",
    personaApoyo: initial?.persona_apoyo ?? "",
    comentario: initial?.comentario ?? "",
  });

  const { data: subcatsData } = useApoyoSubcategoriasDeCategoria(form.subcategoriaFun || null);
  const subcatsFun = (subcatsData?.data ?? []).map((s) => s.subcategoria);

  const set = (k: keyof CrearApoyoInput, v: any) => setForm((f) => {
    const normalized = (k === "horaInicio" || k === "horaFin") && v === "" ? null : v;
    const next = { ...f, [k]: normalized };
    if (k === "subcategoriaFun") next.subSubcategoriaFun = "";
    return next;
  });

  const seleccionarAsesor = (asesorId: string) => {
    if (!asesorId) {
      set("asesorId", "");
      set("asesorNombre", "");
      return;
    }
    const a = asesores.find((x) => x.id === asesorId);
    if (a) {
      set("asesorId", a.id);
      set("asesorNombre", [a.nombre, a.apellido].filter(Boolean).join(" "));
    } else {
      const existing = asesoresOptions.find((o) => o.value === asesorId);
      if (existing) {
        set("asesorId", asesorId);
        set("asesorNombre", existing.label);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
          <h3 className="text-sm font-semibold text-black-85">{initial ? "Editar Apoyo" : "Nuevo Apoyo"}</h3>
          <button onClick={onCancelar} className="text-black-45 hover:text-black-85"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Asesor *</label>
              <Select
                options={[{ value: "", label: "Seleccionar asesor..." }, ...asesoresOptions]}
                value={form.asesorId}
                onChange={(e) => seleccionarAsesor(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Fecha *</label>
              <Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">CategorÃ­a de apoyo *</label>
              <Select
                options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Ãrea a apoyar *</label>
              <Select
                options={[{ value: "", label: "Seleccionar..." }, ...areas.map((a) => ({ value: a.nombre, label: a.nombre }))]}
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">SubcategorÃ­a</label>
              <SearchableSelect
                options={categoriasFun}
                value={form.subcategoriaFun ?? ""}
                onChange={(v) => set("subcategoriaFun", v)}
                placeholder="Buscar subcategorÃ­a..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Sub-subcategorÃ­a</label>
              <SearchableSelect
                options={subcatsFun}
                value={form.subSubcategoriaFun ?? ""}
                onChange={(v) => set("subSubcategoriaFun", v)}
                placeholder={form.subcategoriaFun ? "Buscar sub-subcategorÃ­a..." : "Primero seleccione subcategorÃ­a"}
                disabled={!form.subcategoriaFun}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Dominio</label>
              <Input value={form.dominio ?? ""} onChange={(e) => set("dominio", e.target.value)} placeholder="ej: restaurant.pe" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Cliente</label>
              <Input value={form.clienteNombre ?? ""} onChange={(e) => set("clienteNombre", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Hora inicio</label>
              <Input type="time" value={form.horaInicio ?? ""} onChange={(e) => set("horaInicio", e.target.value)} />
            </div>
            {initial && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-black-45">Hora fin</label>
                <Input type="time" value={form.horaFin ?? ""} onChange={(e) => set("horaFin", e.target.value)} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-black-45">Persona de apoyo</label>
            <Input value={form.personaApoyo ?? ""} onChange={(e) => set("personaApoyo", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-black-45">Comentario</label>
            <Textarea value={form.comentario ?? ""} onChange={(e) => set("comentario", e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-black-10 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onCancelar}>Cancelar</Button>
          <Button
            size="sm"
            onClick={() => {
              if (!form.asesorId || !form.fecha || !form.categoria || !form.area) return;
              const base = {
                asesorId: form.asesorId,
                asesorNombre: form.asesorNombre,
                dominio: form.dominio ? normalizeDomain(form.dominio) : null,
                clienteNombre: form.clienteNombre,
                fecha: form.fecha,
                horaInicio: form.horaInicio || null,
                categoria: form.categoria,
                subcategoriaFun: form.subcategoriaFun,
                subSubcategoriaFun: form.subSubcategoriaFun,
                area: form.area,
                personaApoyo: form.personaApoyo,
                comentario: form.comentario,
              };
              if (initial) {
                // EdiciÃ³n: incluir horaFin (backend determina estado)
                onGuardar({ ...base, horaFin: form.horaFin || null });
              } else {
                // CreaciÃ³n: sin horaFin (backend fuerza PENDIENTE)
                onGuardar(base);
              }
            }}
            disabled={!form.asesorId || !form.fecha || !form.categoria || !form.area}
          >
            {initial ? "Guardar" : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ApoyosPage() {
  const { user } = useAuth();
  const puedeCrear = authService.hasPermiso(user, "Apoyos", "crear");
  const puedeEditar = authService.hasPermiso(user, "Apoyos", "editar");
  const puedeCerrar = authService.hasPermiso(user, "Apoyos", "editar");
  const puedeEliminar = authService.hasPermiso(user, "Apoyos", "eliminar");
  const puedeExportar = authService.hasPermiso(user, "Apoyos", "exportar");
  const puedeAdministrar = authService.hasPermiso(user, "Apoyos", "administrar");

  const [filtros, setFiltros] = useState<Record<string, string>>({
    desde: HOY,
    hasta: HOY,
    estado: "",
    area: "",
  });
  const [misApoyos, setMisApoyos] = useState(!puedeAdministrar);

  const queryFiltros = useMemo(() => ({
    ...filtros,
    ...(misApoyos ? { misApoyos: "true" } : {}),
  }), [filtros, misApoyos]);

  const { data: kpisData } = useApoyoKpis();
  const { data: listData } = useApoyoLista(queryFiltros);
  const cerrarMut = useApoyoCerrar();
  const eliminarMut = useApoyoEliminar();
  const crear = useApoyoCrear();
  const editar = useApoyoActualizar();
  const exportarMut = useApoyoExportar();
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Apoyo | null>(null);

  const kpis = kpisData?.data ?? { total: 0, pendientes: 0, activos: 0, cerrados: 0 };
  const rows = listData?.data ?? [];

  const descargarExcel = async () => {
    setErrorExport(null);
    try {
      const filtrosExport: Record<string, string | undefined> = {};
      if (filtros.desde) filtrosExport.desde = filtros.desde;
      if (filtros.hasta) filtrosExport.hasta = filtros.hasta;
      if (filtros.estado) filtrosExport.estado = filtros.estado;
      if (filtros.area) filtrosExport.area = filtros.area;
      if (misApoyos) filtrosExport.asesorId = user?.id;
      const res = await exportarMut.mutateAsync(filtrosExport);
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErrorExport(e?.message ?? "Error al exportar");
    }
  };

  const columns: Column<Apoyo>[] = useMemo(() => [
    { key: "ticket", label: "Ticket", sortable: true, render: (r) => <span className="text-xs font-mono">{r.ticket}</span> },
    { key: "fecha", label: "Fecha", sortable: true, render: (r) => <span className="text-xs">{fmtFecha(r.fecha)}</span> },
    { key: "asesor_nombre", label: "Asesor", sortable: true, render: (r) => <span className="text-xs font-medium">{r.asesor_nombre}</span> },
    { key: "dominio", label: "Dominio", sortable: true, render: (r) => <span className="text-xs">{r.dominio ?? "â€”"}</span> },
    { key: "cliente_nombre", label: "Cliente", sortable: true, render: (r) => <span className="text-xs">{r.cliente_nombre ?? "â€”"}</span> },
    { key: "categoria", label: "CategorÃ­a", sortable: true, render: (r) => <span className="text-xs">{r.categoria}</span> },
    { key: "area", label: "Ãrea", sortable: true, render: (r) => <span className="text-xs">{r.area}</span> },
    { key: "duracion_min", label: "DuraciÃ³n", sortable: true, render: (r) => <span className="text-xs tabular-nums">{fmtDuracion(r.duracion_min)}</span> },
    { key: "estado", label: "Estado", sortable: true, render: (r) => <Badge variant={ESTADO_BADGE[r.estado] ?? "default"}>{r.estado}</Badge> },
    {
      key: "acciones",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {puedeEditar && (
            <button onClick={() => { setEditando(r); setShowForm(true); }} className="p-1 rounded hover:bg-light text-black-45 hover:text-black-85" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          )}
          {puedeCerrar && r.estado === "ACTIVO" && (
            <button onClick={() => cerrarMut.mutate(r.id)} className="p-1 rounded hover:bg-success-5 text-black-45 hover:text-success" title="Cerrar apoyo">
              <CheckCircle2 size={14} />
            </button>
          )}
          {puedeEliminar && (
            <button onClick={() => { if (confirm("¿Eliminar este apoyo?")) eliminarMut.mutate(r.id); }} className="p-1 rounded hover:bg-danger-5 text-black-45 hover:text-danger" title="Eliminar">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ], [puedeEditar, puedeCerrar, puedeEliminar, cerrarMut, eliminarMut]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black-85">Apoyos del Soporte Especializado</h2>
        <div className="flex items-center gap-2">
          {puedeExportar && (
            <Button
              size="sm"
              variant="ghost"
              onClick={descargarExcel}
              disabled={exportarMut.isPending}
            >
              <Download size={14} /> {exportarMut.isPending ? "Exportando..." : "Descargar Excel"}
            </Button>
          )}
          {puedeCrear && (
            <Button size="sm" onClick={() => { setEditando(null); setShowForm(true); }}>
              <Plus size={14} /> Nuevo Apoyo
            </Button>
          )}
        </div>
      </div>
      {errorExport && (
        <div className="text-xs text-danger bg-danger-5 px-3 py-2 rounded">
          {errorExport}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<HandHelping size={16} />} value={String(kpis.total)} label="Total" />
        <KpiCard icon={<Clock size={16} />} value={String(kpis.pendientes)} label="Pendientes" />
        <KpiCard icon={<PlayCircle size={16} />} value={String(kpis.activos)} label="Activos" />
        <KpiCard icon={<CheckCircle2 size={16} />} value={String(kpis.cerrados)} label="Cerrados" />
      </div>

      <Card>
        <CardHeader title="Filtros" icon={<Filter size={16} />} />
        <CardBody>
          <FiltrosBar filtros={filtros} onChange={setFiltros} onMisApoyos={setMisApoyos} misApoyos={misApoyos} puedeAdministrar={puedeAdministrar} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            getId={(r) => r.id}
            pageSize={15}
            searchable
            searchKeys={["asesor_nombre", "dominio", "cliente_nombre", "categoria", "area"]}
            maxHeight="max-h-[500px]"
          />
        </CardBody>
      </Card>

      {showForm && (
        <FormularioApoyo
          initial={editando ?? undefined}
          onCancelar={() => { setShowForm(false); setEditando(null); }}
          onGuardar={(input) => {
            if (editando) {
              editar.mutate({ id: editando.id, input }, { onSuccess: () => { setShowForm(false); setEditando(null); } });
            } else {
              crear.mutate(input, { onSuccess: () => { setShowForm(false); setEditando(null); } });
            }
          }}
        />
      )}
    </div>
  );
}
