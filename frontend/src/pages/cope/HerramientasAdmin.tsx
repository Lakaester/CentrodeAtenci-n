import { useState, useEffect } from "react";
import { Search, Plus, Edit3, Trash2, X, Save, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Herramienta {
  id: string; nombre: string; descripcion: string; icono: string; color: string;
  categoria: string; urlBase: string; parametros: { nombre: string; etiqueta: string; requerido: boolean }[];
  tipo: string; estado: string; orden: number; visible: boolean; tiposAtencion: string[]; responsable: string; updatedAt: string;
}

const TIPOS = ["pagina_web", "dashboard", "sistema_interno", "api", "plugin", "aplicacion_externa", "documento", "notebooklm"];
const TIPOS_ATENCION = ["Facturación Electrónica", "Integraciones", "Software", "Logística", "Administrativo", "Capacitaciones"];

function vacia(): Herramienta {
  return { id: "", nombre: "", descripcion: "", icono: "Wrench", color: "#64748B", categoria: "", urlBase: "", parametros: [], tipo: "pagina_web", estado: "activo", orden: 0, visible: true, tiposAtencion: [], responsable: "", updatedAt: "" };
}

export default function HerramientasAdmin() {
  const [items, setItems] = useState<Herramienta[]>([]);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Herramienta>(vacia());
  const [search, setSearch] = useState("");

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/herramientas", { params: { search: search || undefined } });
      setItems(res.data.data ?? []);
    } catch { setItems([]); }
  };

  const handleNueva = () => { setForm(vacia()); setEditando(true); };
  const handleEditar = (h: Herramienta) => { setForm({ ...h }); setEditando(true); };
  const handleCancel = () => setEditando(false);

  const handleSave = async () => {
    try {
      if (form.id) await api.put(`/api/herramientas/${form.id}`, form);
      else await api.post("/herramientas", form);
      await fetchItems();
      setEditando(false);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/herramientas/${id}`);
    await fetchItems();
  };

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTipoAtencion = (t: string) => update("tiposAtencion", form.tiposAtencion.includes(t) ? form.tiposAtencion.filter((x) => x !== t) : [...form.tiposAtencion, t]);

  return (
    <div className="flex h-full">
      <div className="w-[380px] min-w-[380px] border-r border-black-10 bg-white flex flex-col">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h1 className="text-sm font-semibold text-black-85">Herramientas</h1>
          <Button size="sm" variant="primary" className="gap-1.5 text-[11px] h-7" onClick={handleNueva}><Plus size={14} /> Nueva</Button>
        </div>
        <div className="border-b border-black-10 p-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-25" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar herramientas..." className="w-full rounded-lg border border-black-10 bg-light py-1.5 pl-8 pr-3 text-xs text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.map((h) => (
            <div key={h.id} className="flex items-center gap-3 border-b border-black-5 px-4 py-3 transition-colors hover:bg-light">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${h.color}20`, color: h.color }}>
                <Wrench size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-black-85">{h.nombre}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", h.estado === "activo" ? "bg-success-5 text-success" : h.estado === "mantenimiento" ? "bg-warning-5 text-warning-65" : "bg-black-10 text-black-45")}>{h.estado}</span>
                </div>
                <p className="truncate text-xs text-black-45">{h.tipo.replace("_", " ")} · {h.categoria}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEditar(h)} className="text-black-25 hover:text-primary"><Edit3 size={13} /></button>
                <button onClick={() => handleDelete(h.id)} className="text-black-25 hover:text-danger"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="p-4 text-xs text-black-25 text-center">Sin herramientas registradas</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-light">
        {!editando ? (
          <div className="flex h-full items-center justify-center text-sm text-black-25">Seleccione o cree una herramienta</div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-black-85">{form.id ? "Editar herramienta" : "Nueva herramienta"}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-[11px] h-7 gap-1" onClick={handleCancel}><X size={13} /> Cancelar</Button>
                <Button size="sm" variant="primary" className="text-[11px] h-7 gap-1" onClick={handleSave}><Save size={13} /> Guardar</Button>
              </div>
            </div>

            <Section title="Información general">
              <Field label="Nombre"><input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
              <Field label="Descripción"><textarea value={form.descripcion} onChange={(e) => update("descripcion", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs min-h-[60px]" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Icono"><input value={form.icono} onChange={(e) => update("icono", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
                <Field label="Color"><input type="color" value={form.color} onChange={(e) => update("color", e.target.value)} className="w-full h-8 rounded-lg border border-black-10 cursor-pointer" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoría"><input value={form.categoria} onChange={(e) => update("categoria", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
                <Field label="Tipo">
                  <select value={form.tipo} onChange={(e) => update("tipo", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs">
                    {TIPOS.map((t) => (<option key={t} value={t}>{t.replace("_", " ")}</option>))}
                  </select>
                </Field>
              </div>
              <Field label="URL Base"><input value={form.urlBase} onChange={(e) => update("urlBase", e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Orden"><input type="number" value={form.orden} onChange={(e) => update("orden", Number(e.target.value))} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
                <Field label="Estado">
                  <select value={form.estado} onChange={(e) => update("estado", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </Field>
              </div>
              <Field label="Responsable"><input value={form.responsable} onChange={(e) => update("responsable", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
            </Section>

            <Section title="Tipos de Atención">
              <div className="flex flex-wrap gap-1.5">
                {TIPOS_ATENCION.map((ta) => (
                  <button key={ta} onClick={() => toggleTipoAtencion(ta)}
                    className={cn("rounded-md border px-2.5 py-1.5 text-[11px] transition-colors", form.tiposAtencion.includes(ta) ? "border-[#2563EB] bg-primary-5 text-primary" : "border-black-10 text-black-45 hover:border-black-10")}>
                    {ta}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Parámetros">
              {form.parametros.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={p.nombre} onChange={(e) => { const pp = [...form.parametros]; pp[i].nombre = e.target.value; update("parametros", pp); }} placeholder="Nombre" className="flex-1 rounded-lg border border-black-10 px-3 py-2 text-xs" />
                  <input value={p.etiqueta} onChange={(e) => { const pp = [...form.parametros]; pp[i].etiqueta = e.target.value; update("parametros", pp); }} placeholder="Etiqueta" className="flex-1 rounded-lg border border-black-10 px-3 py-2 text-xs" />
                  <label className="flex items-center gap-1 text-xs text-black-45 shrink-0"><input type="checkbox" checked={p.requerido} onChange={(e) => { const pp = [...form.parametros]; pp[i].requerido = e.target.checked; update("parametros", pp); }} /> Req.</label>
                  <button onClick={() => update("parametros", form.parametros.filter((_, j) => j !== i))} className="text-black-25 hover:text-danger"><Trash2 size={13} /></button>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => update("parametros", [...form.parametros, { nombre: "", etiqueta: "", requerido: false }])}>+ Agregar parámetro</Button>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-black-10 bg-white p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-black-45">{title}</h3><div className="space-y-2">{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-1 text-[10px] font-medium text-black-25">{label}</p>{children}</div>;
}
