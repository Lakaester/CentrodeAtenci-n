import { useState } from "react";
import { RefreshCcw, Plus, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { useQdCatLista, useQdCatCrear, useQdCatActualizar } from "@/modules/quejas-devoluciones/services/qdConfigService";
import { cn } from "@/lib/utils";

const CATALOGOS = [
  { key: "estados", titulo: "Estados de caso" },
  { key: "resultados", titulo: "Resultados de devolución" },
  { key: "areas", titulo: "Áreas causantes / responsable" },
  { key: "productos", titulo: "Productos" },
  { key: "tiposQueja", titulo: "Tipos de queja" },
];

function PanelCatalogo({ tabla, titulo }: { tabla: string; titulo: string }) {
  const { data: items } = useQdCatLista(tabla);
  const crear = useQdCatCrear(tabla);
  const actualizar = useQdCatActualizar(tabla);
  const [nuevo, setNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const crearItem = async () => {
    if (!nuevo.trim()) return;
    setError(null);
    try { await crear.mutateAsync(nuevo.trim()); setNuevo(""); }
    catch (e: any) { setError(e?.response?.data?.error ?? e.message ?? "Error"); }
  };

  const mover = async (id: string, dir: -1 | 1) => {
    if (!items) return;
    const idx = items.findIndex((i) => i.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= items.length) return;
    const a = items[idx], b = items[target];
    setError(null);
    try {
      await actualizar.mutateAsync({ id: a.id, patch: { orden: b.orden } });
      await actualizar.mutateAsync({ id: b.id, patch: { orden: a.orden } });
    } catch (e: any) { setError(e?.response?.data?.error ?? e.message ?? "Error"); }
  };

  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
        <h3 className="text-xs font-semibold text-black-85">{titulo}</h3>
        <div className="flex items-center gap-1.5">
          <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") crearItem(); }} placeholder="Nuevo…" className="h-7 w-40 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
          <button type="button" onClick={crearItem} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-85"><Plus size={12} /> Nuevo</button>
        </div>
      </div>
      {error && <div className="border-b border-danger-25 bg-danger-5 px-4 py-1.5 text-[10px] text-danger">{error}</div>}
      <div className="px-4 py-1">
        {!items ? <p className="py-2 text-[10px] text-black-25">Cargando…</p> : items.map((i) => (
          <div key={i.id} className="flex items-center gap-2 border-b border-black-5 py-1.5">
            <div className="flex shrink-0 flex-col">
              <button type="button" onClick={() => mover(i.id, -1)} className="text-black-25 hover:text-black-45"><ChevronUp size={12} /></button>
              <button type="button" onClick={() => mover(i.id, 1)} className="text-black-25 hover:text-black-45"><ChevronDown size={12} /></button>
            </div>
            <span className={cn("min-w-0 flex-1 truncate text-[11px] font-medium", i.activo ? "text-black-85" : "text-black-25 line-through")}>{i.nombre}</span>
            <button type="button" onClick={() => actualizar.mutateAsync({ id: i.id, patch: { activo: !i.activo } })} className="rounded p-1 text-black-45 hover:bg-light">
              {i.activo ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QdConfig() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-black-85"><RefreshCcw size={15} className="text-primary" /> Quejas y Devoluciones</h2>
          <p className="mt-0.5 text-xs text-black-45">Catálogos configurables del módulo operacional.</p>
        </div>
        {CATALOGOS.map((c) => <PanelCatalogo key={c.key} tabla={c.key} titulo={c.titulo} />)}
      </div>
    </div>
  );
}
