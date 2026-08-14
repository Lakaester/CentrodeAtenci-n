import { useState } from "react";
import { ReceiptText, Plus, Pencil, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import {
  useEstadosConfig,
  useSubcategoriasConfig,
  useCrearEstado,
  useCrearSubcategoria,
  useActualizarEstadoConfig,
  useActualizarSubcategoriaConfig,
} from "@/modules/facturacion";
import type { ConfigItem } from "@/modules/facturacion";
import { cn } from "@/lib/utils";

function ItemRow({
  item,
  onSave,
  onToggle,
  onMove,
}: {
  item: ConfigItem;
  onSave: (id: string, patch: { nombre?: string; activo?: boolean; orden?: number }) => Promise<unknown>;
  onToggle: (id: string, activo: boolean) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(item.nombre);

  const guardar = async () => {
    const limpio = nombre.trim();
    if (!limpio) return;
    if (limpio === item.nombre) { setEditando(false); return; }
    await onSave(item.id, { nombre: limpio });
    setEditando(false);
  };

  return (
    <div className="flex items-center gap-2 border-b border-black-5 py-1.5">
      <div className="flex shrink-0 flex-col">
        <button type="button" onClick={() => onMove(item.id, -1)} className="text-black-25 hover:text-black-45"><ChevronUp size={12} /></button>
        <button type="button" onClick={() => onMove(item.id, 1)} className="text-black-25 hover:text-black-45"><ChevronDown size={12} /></button>
      </div>
      <span className={cn("w-6 shrink-0 text-center text-[9px] font-mono text-black-25", !item.activo && "opacity-40")}>{item.orden}</span>
      <div className="min-w-0 flex-1">
        {editando ? (
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") guardar(); if (e.key === "Escape") { setEditando(false); setNombre(item.nombre); } }}
            autoFocus
            className="h-7 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none"
          />
        ) : (
          <span className={cn("block truncate text-[11px] font-medium", item.activo ? "text-black-85" : "text-black-25 line-through")}>
            {item.nombre}
            {item.es_interno && <span className="ml-1.5 rounded bg-black-5 px-1 text-[8px] text-black-45">interno</span>}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editando ? (
          <>
            <button type="button" onClick={guardar} className="rounded bg-primary px-2 py-0.5 text-[9px] font-medium text-white">Guardar</button>
            <button type="button" onClick={() => { setEditando(false); setNombre(item.nombre); }} className="rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-45">Cancelar</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditando(true)} className="rounded p-1 text-black-45 hover:bg-light" title="Editar"><Pencil size={12} /></button>
            <button type="button" onClick={() => onToggle(item.id, !item.activo)} className="rounded p-1 text-black-45 hover:bg-light" title={item.activo ? "Desactivar" : "Activar"}>
              {item.activo ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Panel({
  titulo,
  items,
  onCreate,
  onSave,
  onToggle,
}: {
  titulo: string;
  items: ConfigItem[] | undefined;
  onCreate: (nombre: string) => Promise<unknown>;
  onSave: (id: string, patch: { nombre?: string; activo?: boolean; orden?: number }) => Promise<unknown>;
  onToggle: (id: string, activo: boolean) => Promise<unknown>;
}) {
  const [nuevo, setNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const crear = async () => {
    const limpio = nuevo.trim();
    if (!limpio) return;
    setError(null);
    try {
      await onCreate(limpio);
      setNuevo("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al crear");
    }
  };

  const mover = async (id: string, dir: -1 | 1) => {
    const idx = items?.findIndex((i) => i.id === id) ?? -1;
    const target = idx + dir;
    if (idx < 0 || !items || target < 0 || target >= items.length) return;
    const a = items[idx];
    const b = items[target];
    setError(null);
    try {
      await onSave(a.id, { orden: b.orden });
      await onSave(b.id, { orden: a.orden });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al ordenar");
    }
  };

  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
        <h2 className="text-xs font-semibold text-black-85">{titulo}</h2>
        <div className="flex items-center gap-1.5">
          <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") crear(); }} placeholder="Nuevo nombre…" className="h-7 w-44 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
          <button type="button" onClick={crear} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-85">
            <Plus size={12} /> Nuevo
          </button>
        </div>
      </div>
      {error && <div className="border-b border-danger-25 bg-danger-5 px-4 py-1.5 text-[10px] text-danger">{error}</div>}
      <div className="px-4 py-1">
        {!items ? <p className="py-2 text-[10px] text-black-25">Cargando…</p> : items.map((i) => (
          <ItemRow key={i.id} item={i} onSave={onSave} onToggle={onToggle} onMove={mover} />
        ))}
      </div>
    </div>
  );
}

export default function FacturacionConfig() {
  const { data: estados } = useEstadosConfig();
  const { data: subcategorias } = useSubcategoriasConfig();
  const crearEstado = useCrearEstado();
  const crearSub = useCrearSubcategoria();
  const updEstado = useActualizarEstadoConfig();
  const updSub = useActualizarSubcategoriaConfig();

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ReceiptText size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-black-85">Configuración de Facturación</h2>
          </div>
          <p className="mb-3 text-[11px] text-black-45">
            Estados y diagnósticos (subcategorías) utilizados por Control de Facturación. Los estados internos del motor no pueden editarse para no romper el flujo de tiempo.
          </p>
        </div>

        <Panel
          titulo="Estados"
          items={estados}
          onCreate={(nombre) => crearEstado.mutateAsync(nombre)}
          onSave={(id, patch) => updEstado.mutateAsync({ id, patch })}
          onToggle={(id, activo) => updEstado.mutateAsync({ id, patch: { activo } })}
        />

        <Panel
          titulo="Subcategorías / Diagnósticos"
          items={subcategorias}
          onCreate={(nombre) => crearSub.mutateAsync(nombre)}
          onSave={(id, patch) => updSub.mutateAsync({ id, patch })}
          onToggle={(id, activo) => updSub.mutateAsync({ id, patch: { activo } })}
        />
      </div>
    </div>
  );
}
