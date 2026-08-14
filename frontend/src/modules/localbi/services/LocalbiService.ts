import { api } from "@/lib/api";
import type {
  LocalbiHistoriaClinica,
  LocalbiBusquedaSalida,
} from "../types/localbi";

export type LocalbiApiResult<T> =
  | { status: "success" | "warning"; data: T; warnings: string[] }
  | { status: "error"; mensajes: string[]; httpStatus?: number }
  | { status: "not_configured"; mensaje: string }
  | { status: "unavailable"; mensaje: string };

function toResult<T>(res: { data: any }): LocalbiApiResult<T> {
  const body = res.data as any;
  if (body.ok) {
    return { status: body.status ?? "success", data: body.data as T, warnings: body.warnings ?? [] };
  }
  if (body.status === "not_configured") {
    return { status: "not_configured", mensaje: body.error ?? "Integración Localbi pendiente de credencial." };
  }
  if (body.status === "unavailable") {
    return { status: "unavailable", mensaje: body.error ?? "Localbi no disponible." };
  }
  return { status: "error", mensajes: body.mensajes ?? [body.error ?? "Error en Localbi"] };
}

export const localbiService = {
  async buscarUnidades(busqueda: string, pagina = 1, limite = 50): Promise<LocalbiApiResult<LocalbiBusquedaSalida>> {
    const res = await api.get("/localbi/search", { params: { busqueda, pagina, limite } });
    return toResult<LocalbiBusquedaSalida>(res);
  },

  async obtenerHistoria(unidadNegocio: string): Promise<LocalbiApiResult<LocalbiHistoriaClinica>> {
    const res = await api.get(`/localbi/historia/${encodeURIComponent(unidadNegocio)}`);
    return toResult<LocalbiHistoriaClinica>(res);
  },
};
