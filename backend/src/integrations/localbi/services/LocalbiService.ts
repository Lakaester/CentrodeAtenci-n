/**
 * LocalbiService — Lógica de negocio de la integración Localbi.
 *
 * Se encarga de:
 * - búsqueda de unidades de negocio (server-side, paginada);
 * - consulta de Historia Clínica por unidad de negocio;
 * - validación del envelope (tipo 1/2/3).
 *
 * No recalcula ni transforma valores de la fuente.
 */
import { env } from "../../../config/env";
import { LocalbiClient, LocalbiHttpError, LocalbiInvalidResponse, LocalbiTimeout } from "../client/LocalbiClient";
import type {
  LocalbiEnvelope,
  LocalbiHistoriaClinica,
  LocalbiBusquedaResponse,
  LocalbiUnidadNegocio,
} from "../types";

export type LocalbiResult<T> =
  | { status: "success"; data: T; warnings?: string[] }
  | { status: "warning"; data: T; warnings: string[] }
  | { status: "error"; mensajes: string[] }
  | { status: "not_configured"; mensaje: string }
  | { status: "unavailable"; mensaje: string };

interface BusquedaSalida {
  unidades: LocalbiUnidadNegocio[];
  totalRegistros: number;
  pagina: number;
  limite: number;
}

export class LocalbiService {
  private client = new LocalbiClient();

  private checkAuth(): LocalbiResult<never> | null {
    if (env.LOCALBI_MODE === "private" && !env.LOCALBI_TOKEN) {
      return { status: "not_configured", mensaje: "Integración Localbi pendiente de credencial (LOCALBI_TOKEN)." };
    }
    return null;
  }

  private classifyEnvelope<T>(envelope: LocalbiEnvelope<T>): LocalbiResult<T> {
    const tipo = String(envelope.tipo ?? "3");
    if (tipo === "1") return { status: "success", data: envelope.data };
    if (tipo === "2") {
      return { status: "warning", data: envelope.data, warnings: envelope.mensajes ?? [] };
    }
    return { status: "error", mensajes: envelope.mensajes ?? ["Error en Localbi"] };
  }

  /** Traduce un error del cliente a un mensaje claro (sin datos sensibles). */
  private mensajeDeError(err: unknown): string {
    if (err instanceof LocalbiHttpError) return err.message;
    if (err instanceof LocalbiTimeout) return err.message;
    if (err instanceof LocalbiInvalidResponse) return err.message;
    const msg = err instanceof Error ? err.message : String(err);
    return `Localbi no disponible: ${msg}`;
  }

  async buscarUnidades(busqueda: string, pagina = 1, limite = 50): Promise<LocalbiResult<BusquedaSalida>> {
    const auth = this.checkAuth();
    if (auth) return auth;

    try {
      const resp: LocalbiBusquedaResponse = await this.client.getUnidadesNegocioBusqueda(busqueda, pagina, limite);
      const tipo = String(resp.tipo ?? "3");

      if (tipo === "1") {
        return {
          status: "success",
          data: {
            unidades: resp.data ?? [],
            totalRegistros: resp.totalRegistros ?? 0,
            pagina,
            limite,
          },
        };
      }
      if (tipo === "2") {
        return {
          status: "warning",
          warnings: resp.mensajes ?? [],
          data: {
            unidades: resp.data ?? [],
            totalRegistros: resp.totalRegistros ?? 0,
            pagina,
            limite,
          },
        };
      }
      return { status: "error", mensajes: resp.mensajes ?? ["Error en Localbi"] };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  async obtenerHistoria(unidadNegocio: string): Promise<LocalbiResult<LocalbiHistoriaClinica>> {
    const auth = this.checkAuth();
    if (auth) return auth;

    try {
      const envelope = await this.client.getHistoriaClinicaPorPath(unidadNegocio);
      return this.classifyEnvelope(envelope);
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  estado(): { mode: string; configurado: boolean; autenticado: boolean } {
    return {
      mode: env.LOCALBI_MODE,
      configurado: Boolean(env.LOCALBI_BASE_URL),
      autenticado: env.LOCALBI_MODE === "public" || Boolean(env.LOCALBI_TOKEN),
    };
  }
}
