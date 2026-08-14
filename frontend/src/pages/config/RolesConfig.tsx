import { useState } from "react";
import { ShieldCheck, Plus, Pencil, Eye, EyeOff, Copy } from "lucide-react";
import { useRoles, useUsuarios, usePermisos, useCrearRol, useActualizarRol, useSetPermiso } from "@/modules/admin";
import type { AdminRol } from "@/modules/admin";
import { cn } from "@/lib/utils";
import { AccesoTabs } from "./AccesoTabs";

const MODULOS = ["Dashboard", "Atenciones", "Clientes", "Control de Facturación", "Quejas y Devoluciones", "Reportes", "Conocimiento", "Configuración"];
const ACCIONES = ["ver", "crear", "editar", "eliminar", "exportar", "administrar"] as const;

function RolRow({
  rol,
  onSave,
  onToggle,
  onDuplicar,
}: {
  rol: AdminRol;
  onSave: (id: string, patch: { nombre?: string; descripcion?: string | null; activo?: boolean; orden?: number }) => Promise<unknown>;
  onToggle: (id: string, activo: boolean) => Promise<unknown>;
  onDuplicar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(rol.nombre);
  const [descripcion, setDescripcion] = useState(rol.descripcion ?? "");

  const guardar = async () => {
    await onSave(rol.id, { nombre: nombre.trim() || undefined, descripcion: descripcion || null });
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
            <p className={cn("text-[11px] font-medium", rol.activo ? "text-black-85" : "text-black-25 line-through")}>
              {rol.nombre}
              {rol.es_interno && <span className="ml-1.5 rounded bg-black-5 px-1 text-[8px] text-black-45">interno</span>}
            </p>
            {rol.descripcion && <p className="truncate text-[9px] text-black-45">{rol.descripcion}</p>}
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
            <button type="button" onClick={onDuplicar} className="rounded p-1 text-black-45 hover:bg-light" title="Duplicar"><Copy size={12} /></button>
            <button type="button" onClick={() => onToggle(rol.id, !rol.activo)} className="rounded p-1 text-black-45 hover:bg-light" title={rol.activo ? "Desactivar" : "Activar"}>
              {rol.activo ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function RolesConfig() {
  const { data: roles } = useRoles();
  const { data: usuarios } = useUsuarios();
  const crearRol = useCrearRol();
  const updRol = useActualizarRol();
  const setPermiso = useSetPermiso();

  const [rolSelId, setRolSelId] = useState<string | null>(null);
  const { data: permisos } = usePermisos(rolSelId);

  const [nuevoRol, setNuevoRol] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rolSeleccionado = roles?.find((r) => r.id === rolSelId) ?? roles?.[0];

  const permisoVal = (modulo: string, accion: string): boolean => {
    const p = permisos?.find((x) => x.modulo === modulo && x.accion === accion && x.rol_id === (rolSeleccionado?.id ?? rolSelId));
    return p?.permitido ?? false;
  };

  const togglePermiso = async (modulo: string, accion: string, actual: boolean) => {
    if (!rolSeleccionado) return;
    setError(null);
    try {
      await setPermiso.mutateAsync({ modulo, accion, rolId: rolSeleccionado.id, permitido: !actual });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error");
    }
  };

  const crearRolNuevo = async () => {
    if (!nuevoRol.trim()) return;
    setError(null);
    try { await crearRol.mutateAsync({ nombre: nuevoRol.trim() }); setNuevoRol(""); }
    catch (e: any) { setError(e?.response?.data?.error ?? e.message ?? "Error"); }
  };

  const duplicarRol = (r: AdminRol) => {
    crearRol.mutateAsync({ nombre: `${r.nombre} (copia)`, descripcion: r.descripcion }).catch((e: any) => {
      setError(e?.response?.data?.error ?? e.message ?? "Error");
    });
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <AccesoTabs />
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-black-85"><ShieldCheck size={15} className="text-primary" /> Roles y permisos</h2>
          <p className="mt-0.5 text-xs text-black-45">Roles y matriz de permisos por módulo. La autorización real se aplicará en backend.</p>
        </div>

        {error && <div className="rounded border border-danger-25 bg-danger-5 px-3 py-1.5 text-[10px] text-danger">{error}</div>}

        <div className="rounded-lg border border-black-10 bg-white">
          <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
            <h3 className="text-xs font-semibold text-black-85">Roles</h3>
            <div className="flex items-center gap-1.5">
              <input value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") crearRolNuevo(); }} placeholder="Nuevo rol…" className="h-7 w-44 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
              <button type="button" onClick={crearRolNuevo} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-85"><Plus size={12} /> Nuevo</button>
            </div>
          </div>
          <div className="px-4">
            {roles?.map((r) => (
              <RolRow
                key={r.id}
                rol={r}
                onSave={(id, patch) => updRol.mutateAsync({ id, patch })}
                onToggle={(id, activo) => updRol.mutateAsync({ id, patch: { activo } })}
                onDuplicar={() => duplicarRol(r)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-black-10 bg-white">
          <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
            <h3 className="text-xs font-semibold text-black-85">Matriz de permisos</h3>
            <select value={rolSeleccionado?.id ?? ""} onChange={(e) => setRolSelId(e.target.value)} className="h-7 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
              {roles?.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto px-4 py-3">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black-10 text-[9px] uppercase tracking-wider text-black-45">
                  <th className="px-2 py-1.5 font-medium">Módulo</th>
                  {ACCIONES.map((a) => <th key={a} className="px-2 py-1.5 text-center font-medium">{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((mod) => (
                  <tr key={mod} className="border-b border-black-5">
                    <td className="px-2 py-1.5 text-[10px] font-medium text-black-85">{mod}</td>
                    {ACCIONES.map((acc) => {
                      const activo = permisoVal(mod, acc);
                      return (
                        <td key={acc} className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => togglePermiso(mod, acc, activo)}
                            className={cn("inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] transition-colors", activo ? "border-primary bg-primary-10 text-primary" : "border-black-10 text-black-25 hover:border-black-25")}
                          >
                            {activo ? "✓" : "·"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-[10px] text-black-25">
          {usuarios?.length ?? 0} usuario(s) registrados · Los permisos aquí editados quedan preparados para ser aplicados por el backend.
        </div>
      </div>
    </div>
  );
}
