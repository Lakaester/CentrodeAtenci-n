import { useState } from "react";
import { Users2, Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { useEquipos, useUsuarios, useCrearEquipo, useActualizarEquipo } from "@/modules/admin";
import type { AdminEquipo } from "@/modules/admin";
import { cn } from "@/lib/utils";
import { AccesoTabs } from "./AccesoTabs";

function EquipoRow({
  equipo,
  onSave,
  onToggle,
}: {
  equipo: AdminEquipo;
  onSave: (id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }) => Promise<unknown>;
  onToggle: (id: string, activo: boolean) => Promise<unknown>;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(equipo.nombre);
  const [descripcion, setDescripcion] = useState(equipo.descripcion ?? "");

  const guardar = async () => {
    await onSave(equipo.id, { nombre: nombre.trim() || undefined, descripcion: descripcion || null });
    setEditando(false);
  };

  return (
    <div className="flex items-center gap-2 border-b border-black-5 py-2">
      <div className="min-w-0 flex-1">
        {editando ? (
          <div className="space-y-1.5">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-7 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" className="h-7 w-full rounded border border-black-10 px-2 text-[10px] focus:border-primary focus:outline-none" />
          </div>
        ) : (
          <>
            <p className={cn("text-[11px] font-medium", equipo.activo ? "text-black-85" : "text-black-25 line-through")}>
              {equipo.nombre}
              {equipo.es_interno && <span className="ml-1.5 rounded bg-black-5 px-1 text-[8px] text-black-45">interno</span>}
            </p>
            {equipo.descripcion && <p className="truncate text-[9px] text-black-45">{equipo.descripcion}</p>}
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editando ? (
          <>
            <button type="button" onClick={guardar} className="rounded bg-primary px-2 py-0.5 text-[9px] font-medium text-white">Guardar</button>
            <button type="button" onClick={() => setEditando(false)} className="rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-45">Cancelar</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditando(true)} className="rounded p-1 text-black-45 hover:bg-light" title="Editar"><Pencil size={12} /></button>
            <button type="button" onClick={() => onToggle(equipo.id, !equipo.activo)} className="rounded p-1 text-black-45 hover:bg-light" title={equipo.activo ? "Desactivar" : "Activar"}>
              {equipo.activo ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function EquiposConfig() {
  const { data: equipos } = useEquipos();
  const { data: usuarios } = useUsuarios();
  const crearEquipo = useCrearEquipo();
  const updEquipo = useActualizarEquipo();

  const [nuevo, setNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const crear = async () => {
    if (!nuevo.trim()) return;
    setError(null);
    try { await crearEquipo.mutateAsync({ nombre: nuevo.trim() }); setNuevo(""); }
    catch (e: any) { setError(e?.response?.data?.error ?? e.message ?? "Error"); }
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <AccesoTabs />
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-black-85"><Users2 size={15} className="text-primary" /> Equipos</h2>
            <p className="mt-0.5 text-xs text-black-45">Estructura de equipos de trabajo de COPE.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") crear(); }} placeholder="Nuevo equipo…" className="h-7 w-44 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            <button type="button" onClick={crear} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-85"><Plus size={12} /> Nuevo</button>
          </div>
        </div>

        {error && <div className="mb-3 rounded border border-danger-25 bg-danger-5 px-3 py-1.5 text-[10px] text-danger">{error}</div>}

        <div className="rounded-lg border border-black-10 bg-white">
          <div className="border-b border-black-10 px-4 py-3">
            <h3 className="text-xs font-semibold text-black-85">Equipos</h3>
          </div>
          <div className="px-4">
            {!equipos ? <p className="py-2 text-[10px] text-black-25">Cargando…</p> : equipos.map((e) => (
              <EquipoRow key={e.id} equipo={e} onSave={(id, patch) => updEquipo.mutateAsync({ id, patch })} onToggle={(id, activo) => updEquipo.mutateAsync({ id, patch: { activo } })} />
            ))}
          </div>
        </div>

        <div className="mt-3 text-[10px] text-black-25">
          {usuarios?.length ?? 0} usuario(s) registrados · Los usuarios pueden asociarse a un equipo.
        </div>
      </div>
    </div>
  );
}
