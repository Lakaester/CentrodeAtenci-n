/**
 * TareabiClient — Cliente HTTP hacia Tareabi (tareas/desarrollo de Restaurant.pe).
 *
 * API PÚBLICA (sin token). Fuente real confirmada:
 *   https://microservices.restaurant.pe/backendrestaurantpe/public/rest/tareabi
 *
 * Endpoints utilizados:
 *   POST /obtenerLogsByTareaIdAndTicketId/{tareabi_id}/{ticketbi_id}
 *   GET  /tareabi/{id}
 *   GET  /obtenerDatosEstaticos
 *
 * Reutiliza el patrón de LocalbiClient (timeout, errores, retry transitorio, logging sin secretos).
 */
import { env } from "../../../config/env";
import type { TareabiEnvelope, TareabiDetalle, TareabiLogs, TareabiDatosEstaticos } from "../types";

type TareabiMethod = "GET" | "POST";

const SEGMENTO = "/public/rest/tareabi";

const TRANSIENT_STATUS = new Set([502, 503, 504]);

export class TareabiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.LOCALBI_BASE_URL.replace(/\/+$/, "");
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${SEGMENTO}${path}`;
  }

  private headers(): Record<string, string> {
    return { Accept: "application/json" };
  }

  private async request<T>(path: string, method: TareabiMethod = "GET", body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const t0 = Date.now();

    const exec = async (): Promise<T> => {
      const res = await fetch(url, {
        method,
        headers: { ...this.headers(), ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 401) throw new TareabiHttpError("Tareabi requiere autenticación (401).", status);
        if (status === 403) throw new TareabiHttpError("Tareabi denegó el acceso (403).", status);
        if (status === 404) throw new TareabiHttpError("Recurso no encontrado en Tareabi (404).", status);
        if (status >= 500) throw new TareabiHttpError(`Tareabi respondió error de servidor (${status}).`, status);
        throw new TareabiHttpError(`Tareabi respondió HTTP ${status}.`, status);
      }

      const text = await res.text();
      if (!text) throw new TareabiInvalidResponse("Tareabi devolvió una respuesta vacía.");
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new TareabiInvalidResponse("Tareabi devolvió una respuesta JSON inválida.");
      }
    };

    try {
      const data = await exec();
      this.log(path, Date.now() - t0, 200, "ok");
      return data;
    } catch (err) {
      const esTimeout =
        err instanceof TareabiTimeout ||
        (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError"));
      const status = err instanceof TareabiHttpError ? err.status : undefined;
      const esTransitorio = status != null && TRANSIENT_STATUS.has(status);

      if (esTimeout || esTransitorio) {
        try {
          const data = await exec();
          this.log(path, Date.now() - t0, 200, "ok (retry)");
          return data;
        } catch (err2) {
          this.log(path, Date.now() - t0, err instanceof TareabiHttpError ? err.status : undefined, "error");
          throw err2;
        }
      }
      this.log(path, Date.now() - t0, status, "error");
      throw err;
    }
  }

  private log(path: string, ms: number, status: number | undefined, tipo: string): void {
    if (env.NODE_ENV !== "production") {
      console.log(`[Tareabi] ${path} — ${ms}ms — HTTP ${status ?? "-"} — ${tipo}`);
    }
  }

  /** Logs de una tarea + su ticket (estado, comentario, historial de cambios). */
  obtenerLogs(tareabiId: string, ticketbiId: string): Promise<TareabiEnvelope<TareabiLogs>> {
    return this.request<TareabiEnvelope<TareabiLogs>>(
      `/obtenerLogsByTareaIdAndTicketId/${encodeURIComponent(tareabiId)}/${encodeURIComponent(ticketbiId)}`,
      "POST",
      {},
    );
  }

  /** Detalle de una tarea (estado, comentario, responsable, fechas). */
  obtenerDetalle(tareabiId: string): Promise<TareabiEnvelope<TareabiDetalle>> {
    return this.request<TareabiEnvelope<TareabiDetalle>>(`/tareabi/${encodeURIComponent(tareabiId)}`, "GET");
  }

  /** Catálogo de estados/prioridades/tipos de tareas. */
  obtenerDatosEstaticos(): Promise<TareabiEnvelope<TareabiDatosEstaticos>> {
    return this.request<TareabiEnvelope<TareabiDatosEstaticos>>("/obtenerDatosEstaticos", "GET");
  }
}

export class TareabiHttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "TareabiHttpError";
  }
}

export class TareabiInvalidResponse extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TareabiInvalidResponse";
  }
}

export class TareabiTimeout extends Error {
  constructor(message = "Tareabi no respondió a tiempo (timeout).") {
    super(message);
    this.name = "TareabiTimeout";
  }
}
