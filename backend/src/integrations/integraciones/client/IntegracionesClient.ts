/**
 * IntegracionesClient — Cliente HTTP hacia la API de Monitor de Integraciones.
 *
 * API PRIVADA (requiere token). Base URL:
 *   https://api.integraciones.restaurant.pe
 *
 * Endpoints:
 *   GET  /datos/listaInfoLocal
 *   POST /datos/busquedaPedidos
 *
 * Reutiliza el patrón de TareabiClient (timeout, retry transitorio, logging).
 */
import { env } from "../../../config/env";
import type { IntegracionesEnvelope, InfoLocalRegistro, BusquedaPedidosRequest, BusquedaPedidosData } from "../types";

type HttpMethod = "GET" | "POST";

const TRANSIENT_STATUS = new Set([502, 503, 504]);

export class IntegracionesClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.INTEGRACIONES_API_URL.replace(/\/+$/, "");
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json" };
    if (env.INTEGRACIONES_API_TOKEN) {
      h["Authorization"] = `Token ${env.INTEGRACIONES_API_TOKEN}`;
    }
    return h;
  }

  private async request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const t0 = Date.now();

    const exec = async (): Promise<T> => {
      const res = await fetch(url, {
        method,
        headers: { ...this.headers(), ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 401) throw new IntegracionesHttpError("Integraciones requiere autenticación (401).", status);
        if (status === 403) throw new IntegracionesHttpError("Integraciones denegó el acceso (403).", status);
        if (status === 404) throw new IntegracionesHttpError("Recurso no encontrado en Integraciones (404).", status);
        if (status >= 500) throw new IntegracionesHttpError(`Integraciones respondió error de servidor (${status}).`, status);
        throw new IntegracionesHttpError(`Integraciones respondió HTTP ${status}.`, status);
      }

      const text = await res.text();
      if (!text) throw new IntegracionesInvalidResponse("Integraciones devolvió una respuesta vacía.");
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new IntegracionesInvalidResponse("Integraciones devolvió una respuesta JSON inválida.");
      }
    };

    try {
      const data = await exec();
      this.log(path, Date.now() - t0, 200, "ok");
      return data;
    } catch (err) {
      const esTimeout =
        err instanceof IntegracionesTimeout ||
        (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError"));
      const status = err instanceof IntegracionesHttpError ? err.status : undefined;
      const esTransitorio = status != null && TRANSIENT_STATUS.has(status);

      if (esTimeout || esTransitorio) {
        try {
          const data = await exec();
          this.log(path, Date.now() - t0, 200, "ok (retry)");
          return data;
        } catch (err2) {
          this.log(path, Date.now() - t0, err instanceof IntegracionesHttpError ? err.status : undefined, "error");
          throw err2;
        }
      }
      this.log(path, Date.now() - t0, status, "error");
      throw err;
    }
  }

  private log(path: string, ms: number, status: number | undefined, tipo: string): void {
    if (env.NODE_ENV !== "production") {
      console.log(`[Integraciones] ${path} — ${ms}ms — HTTP ${status ?? "-"} — ${tipo}`);
    }
  }

  /** Lista de información de locales (dominio → integraciones/storeIds). */
  obtenerInfoLocales(): Promise<IntegracionesEnvelope<InfoLocalRegistro[]>> {
    return this.request<IntegracionesEnvelope<InfoLocalRegistro[]>>("/datos/listaInfoLocal", "GET");
  }

  /** Búsqueda de pedidos con filtros. */
  buscarPedidos(payload: BusquedaPedidosRequest): Promise<IntegracionesEnvelope<BusquedaPedidosData>> {
    return this.request<IntegracionesEnvelope<BusquedaPedidosData>>("/datos/busquedaPedidos", "POST", payload);
  }
}

export class IntegracionesHttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "IntegracionesHttpError";
  }
}

export class IntegracionesInvalidResponse extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegracionesInvalidResponse";
  }
}

export class IntegracionesTimeout extends Error {
  constructor(message = "Integraciones no respondió a tiempo (timeout).") {
    super(message);
    this.name = "IntegracionesTimeout";
  }
}
