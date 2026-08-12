import { useState, useEffect } from "react";
import { Search, Plus, CheckCircle, Edit3, Trash2, X, Save, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Guia {
  id: string; titulo: string; descripcion: string; tipoAtencion: string; responsable: string;
  etiquetas: string[]; objetivo: string; informacionNecesaria: string[]; posiblesCausas: { titulo: string; descripcion: string; prioridad: string }[];
  procesoRecomendado: { titulo: string; descripcion: string; orden: number }[]; herramientas: string[];
  buenasPracticas: string; criteriosResolucion: string[]; documentos: string[]; workspaces: string[];
  estado: string; version: string; versiones: any[]; createdAt: string; updatedAt: string; publishedAt?: string;
}

const ESTADOS = ["borrador", "en_revision", "publicada", "obsoleta"];
const ESTADO_COLOR: Record<string, string> = { borrador: "bg-black-10 text-black-65", en_revision: "bg-warning-5 text-warning-65", publicada: "bg-success-5 text-success", obsoleta: "bg-danger-5 text-danger" };
const HERRAMIENTAS_DISP = ["Dominio", "Dashboard FE", "Restafact", "Monitor Integraciones", "Microservice", "Postman", "SUNAT", "Dashboard Encolados"];

function GuiaVacia(): Guia {
  return { id: "", titulo: "", descripcion: "", tipoAtencion: "", responsable: "", etiquetas: [], objetivo: "", informacionNecesaria: [], posiblesCausas: [], procesoRecomendado: [], herramientas: [], buenasPracticas: "", criteriosResolucion: [], documentos: [], workspaces: [], estado: "borrador", version: "1.0", versiones: [], createdAt: "", updatedAt: "" };
}

export default function GuiasResolucion() {
  const [guias, setGuias] = useState<Guia[]>([]);
  const [selected, setSelected] = useState<Guia | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Guia>(GuiaVacia());
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  useEffect(() => { fetchGuias(); }, []);

  const fetchGuias = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterEstado) params.estado = filterEstado;
      const res = await api.get("/guias", { params });
      setGuias(res.data.data ?? []);
    } catch { setGuias([]); }
  };

  const handleNueva = () => {
    setForm(GuiaVacia()); setSelected(null); setEditando(true);
  };

  const handleEditar = (g: Guia) => {
    setForm({ ...g }); setSelected(g); setEditando(true);
  };

  const handleCancel = () => { setEditando(false); setSelected(null); };

  const handleSave = async () => {
    try {
      if (form.id) {
        await api.put(`/api/guias/${form.id}`, form);
      } else {
        await api.post("/guias", form);
      }
      await fetchGuias();
      setEditando(false); setSelected(null);
    } catch (err) { console.error(err); }
  };

  const handleEstado = async (id: string, estado: string) => {
    await api.put(`/api/guias/${id}`, { estado });
    await fetchGuias();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/guias/${id}`);
    await fetchGuias();
    if (selected?.id === id) { setSelected(null); setEditando(false); }
  };

  const updateForm = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="flex h-full">
      {/* Lista */}
      <div className="w-[380px] min-w-[380px] border-r border-black-10 bg-white flex flex-col">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h1 className="text-sm font-semibold text-black-85">Guías de Resolución</h1>
          <Button size="sm" variant="primary" className="gap-1.5 text-[11px] h-7" onClick={handleNueva}>
            <Plus size={14} /> Nueva
          </Button>
        </div>
        <div className="flex items-center gap-2 border-b border-black-10 p-2">
          <div className="relative flex-1">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-25" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar guías..." className="w-full rounded-lg border border-black-10 bg-light py-1.5 pl-8 pr-3 text-xs text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-1 border-b border-black-10 px-2 py-1.5">
          <button onClick={() => { setFilterEstado(""); fetchGuias(); }} className={cn("rounded px-2 py-1 text-[10px] font-medium", !filterEstado ? "bg-primary text-white" : "text-black-45 hover:bg-black-5")}>Todas</button>
          {ESTADOS.map((e) => (
            <button key={e} onClick={() => { setFilterEstado(e); fetchGuias(); }} className={cn("rounded px-2 py-1 text-[10px] font-medium", filterEstado === e ? "bg-primary text-white" : "text-black-45 hover:bg-black-5")}>{e.replace("_", " ")}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {guias.map((g) => (
            <button key={g.id} onClick={() => { setSelected(g); setEditando(false); setForm({ ...g }); }}
              className={cn("flex w-full flex-col gap-1 border-b border-black-5 px-4 py-3 text-left transition-colors hover:bg-light", selected?.id === g.id && "bg-primary-5")}>
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-semibold text-black-85">{g.titulo}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", ESTADO_COLOR[g.estado])}>{g.estado.replace("_", " ")}</span>
              </div>
              <p className="truncate text-xs text-black-45">{g.tipoAtencion} · v{g.version}</p>
              <p className="truncate text-[10px] text-black-25">{g.responsable} · {new Date(g.updatedAt).toLocaleDateString("es-PE")}</p>
            </button>
          ))}
          {guias.length === 0 && <p className="p-4 text-xs text-black-25 text-center">Sin guías registradas</p>}
        </div>
      </div>

      {/* Editor / Vista */}
      <div className="flex-1 overflow-y-auto bg-light">
        {!selected && !editando ? (
          <div className="flex h-full items-center justify-center text-sm text-black-25">Seleccione o cree una guía</div>
        ) : editando ? (
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-black-85">{form.id ? "Editar guía" : "Nueva guía"}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-[11px] h-7 gap-1" onClick={handleCancel}><X size={13} /> Cancelar</Button>
                <Button size="sm" variant="primary" className="text-[11px] h-7 gap-1" onClick={handleSave}><Save size={13} /> Guardar</Button>
              </div>
            </div>
            <FormSection title="Información general">
              <Field label="Título"><input value={form.titulo} onChange={(e) => updateForm("titulo", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
              <Field label="Descripción"><textarea value={form.descripcion} onChange={(e) => updateForm("descripcion", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs min-h-[60px]" /></Field>
              <Field label="Tipo de Atención"><input value={form.tipoAtencion} onChange={(e) => updateForm("tipoAtencion", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
              <Field label="Responsable"><input value={form.responsable} onChange={(e) => updateForm("responsable", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" /></Field>
              <Field label="Etiquetas (separadas por coma)">
                <input value={form.etiquetas.join(", ")} onChange={(e) => updateForm("etiquetas", e.target.value.split(",").map((s: string) => s.trim()))} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" />
              </Field>
            </FormSection>
            <FormSection title="Objetivo">
              <textarea value={form.objetivo} onChange={(e) => updateForm("objetivo", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs min-h-[60px]" />
            </FormSection>
            <FormSection title="Información necesaria">
              <TagEditor tags={form.informacionNecesaria} onChange={(v) => updateForm("informacionNecesaria", v)} placeholder="Agregar campo necesario..." />
            </FormSection>
            <FormSection title="Posibles causas">
              {form.posiblesCausas.map((c, i) => (
                <div key={i} className="flex gap-2 items-start mb-2">
                  <div className="flex-1 space-y-1">
                    <input value={c.titulo} onChange={(e) => { const p = [...form.posiblesCausas]; p[i].titulo = e.target.value; updateForm("posiblesCausas", p); }} placeholder="Causa" className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" />
                    <input value={c.descripcion} onChange={(e) => { const p = [...form.posiblesCausas]; p[i].descripcion = e.target.value; updateForm("posiblesCausas", p); }} placeholder="Descripción" className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" />
                  </div>
                  <button onClick={() => updateForm("posiblesCausas", form.posiblesCausas.filter((_, j) => j !== i))} className="text-black-25 hover:text-danger"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => updateForm("posiblesCausas", [...form.posiblesCausas, { titulo: "", descripcion: "", prioridad: "media" }])}>+ Agregar causa</Button>
            </FormSection>
            <FormSection title="Proceso recomendado">
              {form.procesoRecomendado.sort((a, b) => a.orden - b.orden).map((p, i) => (
                <div key={i} className="flex gap-2 items-start mb-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[10px] font-bold text-primary">{p.orden}</span>
                  <div className="flex-1 space-y-1">
                    <input value={p.titulo} onChange={(e) => { const pp = [...form.procesoRecomendado]; pp[i].titulo = e.target.value; updateForm("procesoRecomendado", pp); }} placeholder="Título" className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" />
                    <input value={p.descripcion} onChange={(e) => { const pp = [...form.procesoRecomendado]; pp[i].descripcion = e.target.value; updateForm("procesoRecomendado", pp); }} placeholder="Descripción" className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs" />
                  </div>
                  <button onClick={() => updateForm("procesoRecomendado", form.procesoRecomendado.filter((_, j) => j !== i))} className="text-black-25 hover:text-danger"><Trash2 size={14} /></button>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => updateForm("procesoRecomendado", [...form.procesoRecomendado, { titulo: "", descripcion: "", orden: form.procesoRecomendado.length + 1 }])}>+ Agregar paso</Button>
            </FormSection>
            <FormSection title="Herramientas">
              <div className="flex flex-wrap gap-1.5">
                {HERRAMIENTAS_DISP.map((h) => (
                  <button key={h} onClick={() => updateForm("herramientas", form.herramientas.includes(h) ? form.herramientas.filter((x: string) => x !== h) : [...form.herramientas, h])}
                    className={cn("rounded-md border px-2.5 py-1.5 text-[11px] transition-colors", form.herramientas.includes(h) ? "border-[#2563EB] bg-primary-5 text-primary" : "border-black-10 text-black-45 hover:border-black-10")}>
                    {h}
                  </button>
                ))}
              </div>
            </FormSection>
            <FormSection title="Buenas prácticas">
              <textarea value={form.buenasPracticas} onChange={(e) => updateForm("buenasPracticas", e.target.value)} className="w-full rounded-lg border border-black-10 px-3 py-2 text-xs min-h-[60px]" />
            </FormSection>
            <FormSection title="Criterios de resolución">
              <TagEditor tags={form.criteriosResolucion} onChange={(v) => updateForm("criteriosResolucion", v)} placeholder="Agregar criterio..." />
            </FormSection>
            <FormSection title="Workspaces">
              <TagEditor tags={form.workspaces} onChange={(v) => updateForm("workspaces", v)} placeholder="Agregar workspace..." />
            </FormSection>
          </div>
        ) : selected ? (
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-black-85">{selected.titulo}</h2>
                <p className="text-xs text-black-45">{selected.tipoAtencion} · v{selected.version}</p>
              </div>
              <div className="flex gap-2">
                {selected.estado === "borrador" && <Button size="sm" variant="ghost" className="text-[11px] h-7 gap-1" onClick={() => handleEstado(selected.id, "en_revision")}><Send size={13} /> Enviar a revisión</Button>}
                {selected.estado === "en_revision" && <Button size="sm" variant="primary" className="text-[11px] h-7 gap-1" onClick={() => handleEstado(selected.id, "publicada")}><CheckCircle size={13} /> Publicar</Button>}
                <Button size="sm" variant="primary" className="text-[11px] h-7 gap-1" onClick={() => handleEditar(selected)}><Edit3 size={13} /> Editar</Button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", ESTADO_COLOR[selected.estado])}>{selected.estado.replace("_", " ")}</span>
              {selected.workspaces.map((w) => (<span key={w} className="rounded bg-black-5 px-2 py-0.5 text-[10px] text-black-45">{w}</span>))}
              {selected.etiquetas.map((t) => (<span key={t} className="rounded bg-primary-10 px-2 py-0.5 text-[10px] text-primary">{t}</span>))}
            </div>
            <ViewSection title="Objetivo">{selected.objetivo}</ViewSection>
            <ViewSection title="Información necesaria"><div className="flex flex-wrap gap-1">{selected.informacionNecesaria.map((i) => (<span key={i} className="rounded bg-black-5 px-2 py-1 text-xs text-black-45">{i}</span>))}</div></ViewSection>
            <ViewSection title="Posibles causas">{selected.posiblesCausas.map((c, i) => (<div key={i} className="rounded-lg border border-black-5 p-2 text-xs"><p className="font-medium text-black-85">{c.titulo}</p><p className="text-black-45">{c.descripcion}</p></div>))}</ViewSection>
            <ViewSection title="Proceso recomendado">{selected.procesoRecomendado.sort((a, b) => a.orden - b.orden).map((p) => (<div key={p.orden} className="flex items-start gap-2 rounded-lg border border-black-5 p-2 text-xs"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[9px] font-bold text-primary">{p.orden}</span><div><p className="font-medium text-black-85">{p.titulo}</p><p className="text-black-45">{p.descripcion}</p></div></div>))}</ViewSection>
            <ViewSection title="Herramientas"><div className="flex flex-wrap gap-1">{selected.herramientas.map((h) => (<span key={h} className="rounded-md border border-black-10 px-2.5 py-1.5 text-[11px] text-black-45">{h}</span>))}</div></ViewSection>
            <ViewSection title="Buenas prácticas"><p className="text-xs text-black-45">{selected.buenasPracticas}</p></ViewSection>
            <ViewSection title="Criterios de resolución"><ul className="list-disc pl-4 text-xs text-black-45 space-y-1">{selected.criteriosResolucion.map((c) => (<li key={c}>{c}</li>))}</ul></ViewSection>
            {selected.versiones.length > 1 && <ViewSection title="Historial de versiones"><div className="space-y-1">{selected.versiones.map((v: any, i: number) => (<div key={i} className="flex items-center justify-between rounded-lg border border-black-5 p-2 text-xs"><div><span className="font-medium text-black-85">v{v.version}</span><span className={cn("ml-2 rounded px-1.5 py-0.5 text-[9px]", ESTADO_COLOR[v.estado])}>{v.estado.replace("_", " ")}</span></div><span className="text-black-25">{v.creadoPor} · {new Date(v.creadoEn).toLocaleDateString("es-PE")}</span></div>))}</div></ViewSection>}
            {selected.estado !== "publicada" && <Button size="sm" variant="danger" className="text-[11px] h-7 gap-1" onClick={() => handleDelete(selected.id)}><Trash2 size={13} /> Eliminar borrador</Button>}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-black-10 bg-white p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-black-45">{title}</h3><div className="space-y-2">{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-1 text-[10px] font-medium text-black-25">{label}</p>{children}</div>;
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-black-10 bg-white p-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-black-45">{title}</h3>{children}</div>;
}

function TagEditor({ tags, onChange, placeholder }: { tags: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded bg-primary-10 px-2 py-0.5 text-[11px] text-primary">
            {t}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-danger"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} className="flex-1 rounded-lg border border-black-10 px-3 py-1.5 text-xs" onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { onChange([...tags, input.trim()]); setInput(""); } }} />
        <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => { if (input.trim()) { onChange([...tags, input.trim()]); setInput(""); } }}>+</Button>
      </div>
    </div>
  );
}
