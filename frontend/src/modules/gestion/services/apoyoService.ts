import type { Apoyo, ApoyoKpis, CrearApoyoInput, ActualizarApoyoInput, AsesorInfo } from "../types";

const BASE = "/api/gestion/apoyos";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length > 0 ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : "";
}

export const apoyoService = {
  async listar(filtros: Record<string, string | number | undefined>): Promise<{ data: Apoyo[]; total: number }> {
    return api(qs(filtros));
  },

  async detalle(id: string): Promise<{ data: Apoyo }> {
    return api(`/${id}`);
  },

  async kpis(): Promise<{ data: ApoyoKpis }> {
    return api("/kpis");
  },

  async crear(input: CrearApoyoInput): Promise<{ data: Apoyo }> {
    return api("", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async actualizar(id: string, input: ActualizarApoyoInput): Promise<{ data: Apoyo }> {
    return api(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async cerrar(id: string): Promise<{ data: Apoyo }> {
    return api(`/${id}/cerrar`, { method: "POST" });
  },

  async eliminar(id: string): Promise<{ ok: boolean }> {
    return api(`/${id}`, { method: "DELETE" });
  },

  async areas(): Promise<{ data: { id: string; nombre: string }[] }> {
    return api("/areas");
  },

  async asesores(): Promise<{ data: AsesorInfo[] }> {
    const res = await fetch("/api/gestion/asesores", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async categoriasFun(): Promise<{ data: { categoria: string }[] }> {
    const res = await fetch("/api/gestion/categorias-funcionales", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async subcategoriasDeCategoria(categoria: string): Promise<{ data: { subcategoria: string }[] }> {
    const res = await fetch(`/api/gestion/categorias-funcionales/${encodeURIComponent(categoria)}/subcategorias`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async exportar(filtros: Record<string, string | undefined>): Promise<{ blob: Blob; nombre: string; total: number }> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await fetch(`/api/gestion/apoyos/exportar?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const nombre = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "Apoyos.xlsx";
    const total = Number(res.headers.get("X-Export-Total") ?? "0");
    const blob = await res.blob();
    return { blob, nombre, total };
  },
};
