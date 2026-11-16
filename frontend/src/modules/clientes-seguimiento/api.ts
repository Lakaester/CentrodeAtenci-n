import { api } from "@/lib/api";
import type {
  SeguimientoAtencionesLista,
  SeguimientoCandidatosResponse,
  SeguimientoCrearLoteResult,
  SeguimientoDetalle,
  SeguimientoFiltrosLista,
  SeguimientoGestionInput,
  SeguimientoLista,
  SeguimientoResumen,
} from "./types";

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<{ ok: boolean; data: T }>(url, { params });
  return res.data.data;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await api.post<{ ok: boolean; data: T }>(url, body);
  return res.data.data;
}

async function patch<T>(url: string, body: unknown): Promise<T> {
  const res = await api.patch<{ ok: boolean; data: T }>(url, body);
  return res.data.data;
}

export const seguimientoApi = {
  resumen: (params?: { semana?: string; periodo?: string }) =>
    get<SeguimientoResumen>("/clientes/seguimiento/resumen", params),

  candidatos: (params?: { desde?: string; hasta?: string }) =>
    get<SeguimientoCandidatosResponse>("/clientes/seguimiento/candidatos", params),

  casos: (params?: SeguimientoFiltrosLista) =>
    get<SeguimientoLista>("/clientes/seguimiento/casos", params as Record<string, unknown>),

  detalle: (id: string) =>
    get<SeguimientoDetalle>(`/clientes/seguimiento/casos/${id}`),

  atenciones: (id: string, params?: { page?: number; pageSize?: number; categoria?: string; subcategoria?: string }) =>
    get<SeguimientoAtencionesLista>(`/clientes/seguimiento/casos/${id}/atenciones`, params),

  crearLote: (body: { semana?: string; desde?: string; hasta?: string; claves?: string[] }) =>
    post<SeguimientoCrearLoteResult>("/clientes/seguimiento/lotes", body),

  gestionar: (id: string, body: SeguimientoGestionInput) =>
    post<SeguimientoDetalle>(`/clientes/seguimiento/casos/${id}/gestiones`, body),

  actualizar: (id: string, body: { asesorId?: string | null; proximoContactoAt?: string | null }) =>
    patch<SeguimientoDetalle>(`/clientes/seguimiento/casos/${id}`, body),
};
