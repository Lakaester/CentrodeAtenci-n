/**
 * LocalbiClient — Cliente HTTP hacia Localbi (Historia Clínica de Restaurant.pe).
 *
 * Único componente que conoce la URL de Localbi y la selección public/private.
 * La modalidad depende EXCLUSIVAMENTE de LOCALBI_MODE (sin fallback automático).
 *
 *   public  → {base}/public/rest/localbi/*
 *   private → {base}/api/rest/localbi/*  +  Authorization: Token token="..."
 */
import { env } from "../../../config/env";
import type {
  LocalbiEnvelope,
  LocalbiHistoriaClinica,
  LocalbiBusquedaResponse,
} from "../types";

type LocalbiMethod = "GET" | "POST";

const SEGMENTO_PUBLICO = "/public/rest/localbi";
const SEGMENTO_PRIVADO = "/api/rest/localbi";

/** Códigos HTTP considerados transitorios (elegibles para reintento). */
const TRANSIENT_STATUS = new Set([502, 503, 504]);

/** Errores HTTP que NO deben reintentarse. */
const NON_RETRY_STATUS = new Set([401, 403, 404, 400, 422]);

export class LocalbiClient {
  private baseUrl: string;
  private mode: "public" | "private";
  private token: string;

  constructor() {
    this.baseUrl = env.LOCALBI_BASE_URL.replace(/\/+$/, "");
    this.mode = env.LOCALBI_MODE;
    this.token = env.LOCALBI_TOKEN;
  }

  private buildUrl(path: string): string {
    const segmento = this.mode === "public" ? SEGMENTO_PUBLICO : SEGMENTO_PRIVADO;
    return `${this.baseUrl}${segmento}${path}`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json" };
    if (this.mode === "private") {
      h.Authorization = `Token token="${this.token}"`;
    }
    return h;
  }

  /**
   * Ejecuta la petición HTTP hacia Localbi.
   *
   * - Distingue códigos HTTP para un mensaje de error claro.
   * - Reintenta una vez (máx. 1) únicamente ante errores transitorios
   *   (timeout, 502, 503, 504). Nunca para 401/403/404/validación.
   * - Registra un log breve (endpoint lógico, duración, HTTP status, tipo).
   *   NUNCA registra el token ni el header Authorization.
   *
   * El contrato externo de los métodos no cambia.
   */
  private async request<T>(path: string, method: LocalbiMethod = "GET", body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const t0 = Date.now();

    const exec = async (): Promise<T> => {
      const res = await fetch(url, {
        method,
        headers: { ...this.headers(), ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });

      // Respuesta con error HTTP explícito.
      if (!res.ok) {
        const status = res.status;
        let detalle = "";
        try {
          const txt = await res.text();
          try {
            const parsed = JSON.parse(txt);
            detalle = parsed?.mensajes?.join(" · ") || parsed?.message || "";
          } catch {
            detalle = txt.slice(0, 200);
          }
        } catch {
          // sin cuerpo
        }
        if (status === 401) throw new LocalbiHttpError("Localbi requiere autenticación (401).", status);
        if (status === 403) throw new LocalbiHttpError("Localbi denegó el acceso (403).", status);
        if (status === 404) throw new LocalbiHttpError("Recurso no encontrado en Localbi (404).", status);
        if (status >= 500) throw new LocalbiHttpError(`Localbi respondió error de servidor (${status}).`, status);
        throw new LocalbiHttpError(`Localbi respondió HTTP ${status}.`, status, detalle);
      }

      // Respuesta OK: parsear JSON con tolerancia a cuerpo vacío/inválido.
      const text = await res.text();
      if (!text) {
        throw new LocalbiInvalidResponse("Localbi devolvió una respuesta vacía.");
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new LocalbiInvalidResponse("Localbi devolvió una respuesta JSON inválida.");
      }
    };

    try {
      const data = await exec();
      this.log(path, Date.now() - t0, 200, "ok");
      return data;
    } catch (err) {
      // Normalizar timeout de AbortSignal.timeout.
      const esTimeout =
        err instanceof LocalbiTimeout ||
        (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError"));
      if (esTimeout) {
        const te = err instanceof LocalbiTimeout ? err : new LocalbiTimeout();
        try {
          const data = await exec();
          this.log(path, Date.now() - t0, 200, "ok (retry)");
          return data;
        } catch (err2) {
          this.log(path, Date.now() - t0, this.errStatus(err2), "error");
          throw err2;
        }
      }

      const status = err instanceof LocalbiHttpError ? err.status : undefined;
      const esTransitorio = status != null && TRANSIENT_STATUS.has(status);

      if (esTransitorio) {
        // Retry máx. 1 para errores transitorios.
        try {
          const data = await exec();
          this.log(path, Date.now() - t0, 200, "ok (retry)");
          return data;
        } catch (err2) {
          this.log(path, Date.now() - t0, this.errStatus(err2), "error");
          throw err2;
        }
      }

      this.log(path, Date.now() - t0, status ?? this.errStatus(err), "error");
      throw err;
    }
  }

  private errStatus(err: unknown): number | undefined {
    return err instanceof LocalbiHttpError ? err.status : undefined;
  }

  private log(path: string, ms: number, status: number | undefined, tipo: string): void {
    // Log breve y controlado: sin token ni Authorization.
    if (env.NODE_ENV !== "production") {
      console.log(`[Localbi] ${path} — ${ms}ms — HTTP ${status ?? "-"} — ${tipo}`);
    }
  }

  getUnidadesNegocioBusqueda(busqueda: string, pagina = 1, limite = 50): Promise<LocalbiBusquedaResponse> {
    return this.request<LocalbiBusquedaResponse>("/getUnidadesNegocioBusqueda", "POST", {
      busqueda,
      pagina,
      limite,
    });
  }

  getUnidadesNegocioCombo(): Promise<LocalbiEnvelope<string[]>> {
    return this.request<LocalbiEnvelope<string[]>>("/getUnidadesNegocioCombo", "GET");
  }

  getListaUnidadesNegocio(): Promise<LocalbiEnvelope<unknown[]>> {
    return this.request<LocalbiEnvelope<unknown[]>>("/getListaUnidadesNegocio", "GET");
  }

  getHistoriaClinicaPorPath(unidadNegocio: string): Promise<LocalbiEnvelope<LocalbiHistoriaClinica>> {
    return this.request<LocalbiEnvelope<LocalbiHistoriaClinica>>(
      `/getHistoriaClinica/${encodeURIComponent(unidadNegocio)}`,
      "GET",
    );
  }

  getHistoriaClinicaPorBody(unidadNegocio: string): Promise<LocalbiEnvelope<LocalbiHistoriaClinica>> {
    return this.request<LocalbiEnvelope<LocalbiHistoriaClinica>>("/getHistoriaClinica", "POST", {
      unidad_negocio: unidadNegocio,
    });
  }
}

/** Error HTTP con status. */
export class LocalbiHttpError extends Error {
  constructor(message: string, public status: number, public detalle?: string) {
    super(message);
    this.name = "LocalbiHttpError";
  }
}

/** Error por respuesta inválida (vacía o JSON roto). */
export class LocalbiInvalidResponse extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalbiInvalidResponse";
  }
}

/** Error de timeout (AbortSignal.timeout). */
export class LocalbiTimeout extends Error {
  constructor(message = "Localbi no respondió a tiempo (timeout).") {
    super(message);
    this.name = "LocalbiTimeout";
  }
}
