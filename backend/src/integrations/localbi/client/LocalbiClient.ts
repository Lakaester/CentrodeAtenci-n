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

  private async request<T>(path: string, method: LocalbiMethod = "GET", body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const res = await fetch(url, {
      method,
      headers: { ...this.headers(), ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      throw new Error(`Localbi respondió HTTP ${res.status}`);
    }

    const data = (await res.json()) as T;
    return data;
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
