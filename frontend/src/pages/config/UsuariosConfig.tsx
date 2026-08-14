import { useState } from "react";
import { Users, Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { useUsuarios, useRoles, useEquipos, useCrearUsuario, useActualizarUsuario } from "@/modules/admin";
import type { AdminUsuario } from "@/modules/admin";
import { cn } from "@/lib/utils";
import { AccesoTabs } from "./AccesoTabs";

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    activo: "bg-success-5 text-success",
    inactivo: "bg-black-5 text-black-65",
    suspendido: "bg-danger-5 text-danger",
  };
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", map[estado] ?? "bg-black-5 text-black-45")}>{estado}</span>;
}

export default function UsuariosConfig() {
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: roles } = useRoles();
  const { data: equipos } = useEquipos();
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<AdminUsuario | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", rol: "", equipoId: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: "", apellido: "", email: "", rol: "", equipoId: "", password: "" }); setShowPw(false); setAbierto(true); setError(null); };
  const abrirEditar = (u: AdminUsuario) => {
    setEditando(u);
    setForm({ nombre: u.nombre, apellido: u.apellido ?? "", email: u.email, rol: u.rol ?? "", equipoId: u.equipo_id ?? "", password: "" });
    setShowPw(false);
    setAbierto(true); setError(null);
  };

  const guardar = async () => {
    setError(null);
    try {
      if (editando) {
        const patch: { nombre: string; apellido: string | null; email: string; rol: string | null; equipoId: string | null; password?: string } = {
          nombre: form.nombre, apellido: form.apellido || null, email: form.email, rol: form.rol || null, equipoId: form.equipoId || null,
        };
        if (form.password) patch.password = form.password;
        await actualizar.mutateAsync({ id: editando.id, patch });
      } else {
        await crear.mutateAsync({ nombre: form.nombre, apellido: form.apellido || null, email: form.email, rol: form.rol || null, equipoId: form.equipoId || null, password: form.password || undefined });
      }
      setAbierto(false);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al guardar");
    }
  };

  const toggle = async (u: AdminUsuario) => {
    const nuevo = u.estado === "activo" ? "inactivo" : "activo";
    await actualizar.mutateAsync({ id: u.id, patch: { estado: nuevo } });
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <AccesoTabs />
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-black-85"><Users size={15} className="text-primary" /> Usuarios</h2>
            <p className="mt-0.5 text-xs text-black-45">Administración de usuarios y acceso a COPE.</p>
          </div>
          <button type="button" onClick={abrirNuevo} className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85">
            <Plus size={13} /> Nuevo usuario
          </button>
        </div>

        {abierto && (
          <div className="mb-4 space-y-2 rounded-lg border border-black-10 bg-white p-4">
            <div className="grid grid-cols-2 gap-2">
              <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre *" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
              <input value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            </div>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Correo *" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            <div className="relative">
              <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} type={showPw ? "text" : "password"} placeholder={editando ? "Nueva contraseña (opcional)" : "Contraseña *"} className="h-8 w-full rounded border border-black-10 px-2 pr-9 text-[11px] focus:border-primary focus:outline-none" />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-black-45 hover:text-black-65"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))} className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                <option value="">Rol…</option>
                {roles?.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
              <select value={form.equipoId} onChange={(e) => setForm((f) => ({ ...f, equipoId: e.target.value }))} className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                <option value="">Equipo…</option>
                {equipos?.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            {error && <p className="text-[10px] text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAbierto(false)} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">Cancelar</button>
              <button type="button" onClick={guardar} disabled={crear.isPending || actualizar.isPending} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">
                {editando ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-black-10 bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black-10 text-[9px] uppercase tracking-wider text-black-45">
                <th className="px-3 py-2 font-medium">Usuario</th>
                <th className="px-3 py-2 font-medium">Correo</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Equipo</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Último acceso</th>
                <th className="px-3 py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-3 py-4 text-[11px] text-black-25">Cargando…</td></tr>}
              {!isLoading && (!usuarios || usuarios.length === 0) && (
                <tr><td colSpan={7} className="px-3 py-4 text-center text-[11px] text-black-25">Sin usuarios registrados</td></tr>
              )}
              {usuarios?.map((u) => (
                <tr key={u.id} className="border-b border-black-5 hover:bg-light">
                  <td className="px-3 py-2">
                    <span className="text-[11px] font-medium text-black-85">{u.nombre}{u.apellido ? ` ${u.apellido}` : ""}</span>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-black-45">{u.email}</td>
                  <td className="px-3 py-2 text-[10px] text-black-45">{roles?.find((r) => r.id === u.rol)?.nombre ?? u.rol ?? "—"}</td>
                  <td className="px-3 py-2 text-[10px] text-black-45">{equipos?.find((e) => e.id === u.equipo_id)?.nombre ?? "—"}</td>
                  <td className="px-3 py-2">{estadoBadge(u.estado)}</td>
                  <td className="px-3 py-2 text-[10px] text-black-45">{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-PE") : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => abrirEditar(u)} className="rounded p-1 text-black-45 hover:bg-light" title="Editar"><Pencil size={12} /></button>
                      <button type="button" onClick={() => toggle(u)} className="rounded p-1 text-black-45 hover:bg-light" title={u.estado === "activo" ? "Desactivar" : "Activar"}>
                        {u.estado === "activo" ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
