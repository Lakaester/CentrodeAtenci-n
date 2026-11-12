/**
 * LocalbiService — Lógica de negocio de la integración Localbi.
 *
 * Se encarga de:
 * - búsqueda de unidades de negocio (server-side, paginada) — buscarUnidades();
 * - búsqueda de clientes por dominio/local (resultados a nivel dominio) — buscarClientes();
 * - consulta de Historia Clínica por unidad de negocio;
 * - validación del envelope (tipo 1/2/3).
 *
 * No recalcula ni transforma valores de la fuente.
 */
import { env } from "../../../config/env";
import { LocalbiClient, LocalbiHttpError, LocalbiInvalidResponse, LocalbiTimeout } from "../client/LocalbiClient";
import { buscarDominiosCandidatos } from "../../../repositories/dominioDiscovery.repository";
import { dominioUnitIndex } from "./DominioUnitIndex";
import { normalizeDomain } from "../../../domain/contacto/normalizacion";
import type {
  LocalbiEnvelope,
  LocalbiHistoriaClinica,
  LocalbiBusquedaResponse,
  LocalbiUnidadNegocio,
  ResultadoBusquedaCliente,
  BusquedaClienteSalida,
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

/** Máximo de dominios candidatos a resolver vía Historia Clínica. */
const MAX_RESOLUCIONES = 5;
/** Máximo de dominios candidatos a resolver vía descubrimiento SQL (buscarClientes). */
const MAX_DOMINIOS_SQL = 10;
/** Máximo de unidades a procesar para extraer dominios (buscarClientes). */
const MAX_UNIDADES_HISTORIA = 5;

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

  // ──────────────────────────────────────────────────────────────────────────
  // Búsqueda de unidades (formato original — para ContactoDominioService, etc.)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Resuelve un dominio candidato a unidad de negocio via Historia Clínica.
   * Devuelve la unidad si el dominio aparece en la ficha, o null si no.
   */
  private async resolverDominioAUnidad(dominio: string): Promise<{
    unidad: LocalbiUnidadNegocio;
    dominioCoincidente: string;
    localbi_id: string;
    local: string;
  } | null> {
    const d = normalizeDomain(dominio);
    if (!d) return null;

    // Buscar por subdominio directo
    const subdominio = d.split(".")[0];
    const directa = await this.client.getUnidadesNegocioBusqueda(subdominio, 1, 50);
    const tipoDirecta = String(directa.tipo ?? "3");

    const candidatosInit = new Map<string, { unidad: string; nombre: string; total_locales: number }>();
    if (tipoDirecta === "1" || tipoDirecta === "2") {
      for (const u of directa.data ?? []) {
        candidatosInit.set(u.unidad_negocio, {
          unidad: u.unidad_negocio,
          nombre: u.nombre,
          total_locales: u.total_locales ?? 0,
        });
      }
    }

    // Fallback: separaciones de palabras
    if (candidatosInit.size === 0) {
      const consultas: string[] = [];
      for (let i = 2; i < subdominio.length - 1; i++) {
        const a = subdominio.slice(0, i);
        const b = subdominio.slice(i);
        if (a.length >= 2 && b.length >= 2) consultas.push(`${a} ${b}`);
      }
      const resultados = await Promise.all(
        consultas.map((q) => this.client.getUnidadesNegocioBusqueda(q, 1, 50))
      );
      for (const r of resultados) {
        const t = String(r.tipo ?? "3");
        if (t !== "1" && t !== "2") continue;
        for (const u of r.data ?? []) {
          if (!candidatosInit.has(u.unidad_negocio)) {
            candidatosInit.set(u.unidad_negocio, {
              unidad: u.unidad_negocio,
              nombre: u.nombre,
              total_locales: u.total_locales ?? 0,
            });
          }
        }
      }
    }

    if (candidatosInit.size === 0) return null;

    // Consultar Historia Clínica de cada candidato y verificar dominio
    const MAX_CANDIDATOS_HISTORIA = 10;
    const candidatos = [...candidatosInit.values()].slice(0, MAX_CANDIDATOS_HISTORIA);

    for (const c of candidatos) {
      const hist = await this.client.getHistoriaClinicaPorPath(c.unidad);
      const histTipo = String(hist.tipo ?? "3");
      if (histTipo !== "1" && histTipo !== "2") continue;

      const ficha = hist.data as LocalbiHistoriaClinica;
      const dominiosFicha = (ficha.dominios ?? []).map((x) => normalizeDomain(x.dominio)).filter(Boolean);
      if (dominiosFicha.includes(d)) {
        const dominioEntry = (ficha.dominios ?? []).find(
          (x) => normalizeDomain(x.dominio) === d
        );
        const localName = dominioEntry?.locales?.[0]?.nombre ?? "";
        const localbiId = dominioEntry?.locales?.[0]?.localbi_id ?? "";
        const locales = (ficha.dominios ?? []).flatMap((x) => x.locales ?? []);
        return {
          unidad: {
            unidad_negocio: c.unidad,
            nombre: ficha.unidadnegocio_nombre || c.nombre,
            paises: [],
            cs: { localbi_kam: "", localbi_kamid: "" },
            total_locales: locales.length || c.total_locales,
            activos: 0,
            inactivos: 0,
            churn: 0,
            sin_implementar: 0,
            pago_mensual: ficha.pago_mensual ?? null,
            aporte_mensual_total: null,
            segmento: ficha.segmento || "",
            coincidencia: `Local/Dominio: ${d}`,
          },
          dominioCoincidente: d,
          localbi_id: localbiId,
          local: localName,
        };
      }
    }
    return null;
  }

  async buscarUnidades(busqueda: string, pagina = 1, limite = 50): Promise<LocalbiResult<BusquedaSalida>> {
    const auth = this.checkAuth();
    if (auth) return auth;

    try {
      // 1. Búsqueda directa en LocalBI por nombre de unidad
      const resp: LocalbiBusquedaResponse = await this.client.getUnidadesNegocioBusqueda(busqueda, pagina, limite);
      const tipo = String(resp.tipo ?? "3");

      const unidadesDirectas: LocalbiUnidadNegocio[] = (tipo === "1" || tipo === "2") ? (resp.data ?? []) : [];
      const totalDirecto = (tipo === "1" || tipo === "2") ? (resp.totalRegistros ?? 0) : 0;

      // 2. Búsqueda por dominio/local en v_unificado_norm (descubrimiento)
      const dominiosCandidatos = await buscarDominiosCandidatos(busqueda);
      const dominiosAResolver = dominiosCandidatos.slice(0, MAX_RESOLUCIONES);

      const unidadesPorDominio: LocalbiUnidadNegocio[] = [];
      if (dominiosAResolver.length > 0) {
        const resueltas = await Promise.all(
          dominiosAResolver.map((c) => this.resolverDominioAUnidad(c.dominio))
        );
        for (const r of resueltas) {
          if (r) unidadesPorDominio.push(r.unidad);
        }
      }

      // 3. Merge y deduplicación: priorizar coincidencia directa de unidad
      const unidadesDirectasMap = new Map(unidadesDirectas.map((u) => [u.unidad_negocio, u]));
      const mergeadas: LocalbiUnidadNegocio[] = [...unidadesDirectas];

      for (const ud of unidadesPorDominio) {
        const existente = unidadesDirectasMap.get(ud.unidad_negocio);
        if (existente) {
          if (!existente.coincidencia && ud.coincidencia) {
            existente.coincidencia = ud.coincidencia;
          }
        } else {
          mergeadas.push(ud);
        }
      }

      if (tipo === "error") {
        return { status: "error", mensajes: resp.mensajes ?? ["Error en Localbi"] };
      }

      const salida: BusquedaSalida = {
        unidades: mergeadas,
        totalRegistros: totalDirecto + unidadesPorDominio.filter(
          (u) => !unidadesDirectasMap.has(u.unidad_negocio)
        ).length,
        pagina,
        limite,
      };

      if (tipo === "2") {
        return { status: "warning", warnings: resp.mensajes ?? [], data: salida };
      }
      return { status: "success", data: salida };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Búsqueda de clientes (resultados a nivel dominio — para /clientes COPE)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Busca clientes. Cada resultado es UN DOMINIO con su local y unidad de negocio.
   *
   * Flujo:
   *   1. Búsqueda directa en LocalBI por nombre de unidad → extraer dominios de historia clínica
   *   2. Descubrimiento SQL por dominio en v_unificado_norm → resolver a unidad → extraer local
   *   3. Merge y deduplicación por dominio
   */
  async buscarClientes(busqueda: string, pagina = 1, limite = 50): Promise<LocalbiResult<BusquedaClienteSalida>> {
    const auth = this.checkAuth();
    if (auth) return auth;

    try {
      // Disparar construcción del índice en background (no bloquea)
      dominioUnitIndex.ensure();

      // ─── FUENTE 1: Búsqueda directa en LocalBI por nombre de unidad ───
      const resp: LocalbiBusquedaResponse = await this.client.getUnidadesNegocioBusqueda(busqueda, pagina, limite);
      const tipo = String(resp.tipo ?? "3");
      const unidadesDirectas = (tipo === "1" || tipo === "2") ? (resp.data ?? []) : [];
      const totalDirecto = (tipo === "1" || tipo === "2") ? (resp.totalRegistros ?? 0) : 0;

      // Para cada unidad encontrada, extraer dominios de su historia clínica
      const resultadosPorUnidad: ResultadoBusquedaCliente[] = [];
      if (unidadesDirectas.length > 0) {
        const unidadesAProcesar = unidadesDirectas.slice(0, MAX_UNIDADES_HISTORIA);
        const historias = await Promise.all(
          unidadesAProcesar.map((u) => this.extraerDominiosDeUnidad(u.unidad_negocio, u.nombre, u.segmento))
        );
        for (const dominios of historias) {
          resultadosPorUnidad.push(...dominios);
        }
      }

      // ─── FUENTE 2: Descubrimiento SQL por dominio en v_unificado_norm ───
      const dominiosCandidatos = await buscarDominiosCandidatos(busqueda);
      const dominiosAResolver = dominiosCandidatos.slice(0, MAX_DOMINIOS_SQL);

      const resultadosPorDominio: ResultadoBusquedaCliente[] = [];
      for (const c of dominiosAResolver) {
        const r = await this.resolverDominioADominio(c.dominio);
        if (r) resultadosPorDominio.push(r);
      }

      // ─── MERGE y DEDUPLICACIÓN por dominio ───
      const normalizarClave = (dominio: string) =>
        normalizeDomain(dominio) ?? dominio.trim().toLowerCase();
      const dominiosVistos = new Set<string>();
      const mergeados: ResultadoBusquedaCliente[] = [];

      for (const r of [...resultadosPorUnidad, ...resultadosPorDominio]) {
        const key = normalizarClave(r.dominio);
        if (!dominiosVistos.has(key)) {
          dominiosVistos.add(key);
          mergeados.push(r);
        }
      }

      // Ordenar alfabéticamente por dominio
      mergeados.sort((a, b) => a.dominio.localeCompare(b.dominio));

      if (tipo === "error") {
        return { status: "error", mensajes: resp.mensajes ?? ["Error en Localbi"] };
      }

      // La paginación de Localbi cuenta los resultados directos; los dominios
      // descubiertos por SQL son adicionales y deben reflejarse en el total.
      const directos = new Set(resultadosPorUnidad.map((r) => normalizarClave(r.dominio)));
      const sqlExtra = resultadosPorDominio.filter(
        (r) => !directos.has(normalizarClave(r.dominio)),
      ).length;
      const totalRegistros =
        totalDirecto > 0
          ? totalDirecto + sqlExtra
          : Math.max(mergeados.length, sqlExtra);

      const salida: BusquedaClienteSalida = {
        resultados: mergeados,
        totalRegistros,
        pagina,
        limite,
      };

      if (tipo === "2") {
        return { status: "warning", warnings: resp.mensajes ?? [], data: salida };
      }
      return { status: "success", data: salida };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  /**
   * Resuelve un dominio a nivel dominio (devuelve ResultadoBusquedaCliente).
   * Si el índice está listo, lo usa (sin HTTP). Si no, resuelve via HTTP.
   */
  private async resolverDominioADominio(dominio: string): Promise<ResultadoBusquedaCliente | null> {
    const normDom = normalizeDomain(dominio);
    if (!normDom) return null;

    // Fast path: usar índice si está listo
    const resolved = dominioUnitIndex.resolve(normDom);
    if (resolved) {
      return {
        dominio: normDom,
        local: resolved.local,
        localbi_id: resolved.localbi_id,
        unidad_negocio: resolved.unidad_negocio,
        unidad_nombre: resolved.unidad_negocio,
        segmento: "",
        coincidencia: `Dominio: ${normDom}`,
      };
    }

    // Fallback HTTP: resolver via LocalBI cuando el índice no está listo
    const unidadResult = await this.resolverDominioAUnidad(normDom);
    if (!unidadResult) return null;

    return {
      dominio: normDom,
      local: unidadResult.local,
      localbi_id: unidadResult.localbi_id,
      unidad_negocio: unidadResult.unidad.unidad_negocio,
      unidad_nombre: unidadResult.unidad.nombre,
      segmento: "",
      coincidencia: `Dominio: ${normDom}`,
    };
  }

  /**
   * Extrae todos los dominios de una unidad vía Historia Clínica.
   * Devuelve un array de ResultadoBusquedaCliente (uno por dominio).
   */
  private async extraerDominiosDeUnidad(
    unidadNegocio: string,
    unidadNombre: string,
    segmento: string,
  ): Promise<ResultadoBusquedaCliente[]> {
    // Primero intentar desde el índice (sin HTTP)
    const dominiosIndex = dominioUnitIndex.getDominiosPorUnidad(unidadNegocio);
    if (dominiosIndex) {
      return dominiosIndex.map((d) => ({
        dominio: d.dominio,
        local: d.local,
        localbi_id: d.localbi_id,
        unidad_negocio: unidadNegocio,
        unidad_nombre: unidadNombre,
        segmento,
        coincidencia: `Unidad: ${unidadNegocio}`,
      }));
    }

    // Fallback: fetch historia clínica
    try {
      const hist = await this.client.getHistoriaClinicaPorPath(unidadNegocio);
      const histTipo = String(hist.tipo ?? "3");
      if (histTipo !== "1" && histTipo !== "2") return [];

      const ficha = hist.data as LocalbiHistoriaClinica;
      if (!ficha?.dominios?.length) return [];

      return ficha.dominios.map((dom) => ({
        dominio: normalizeDomain(dom.dominio) || dom.dominio,
        local: dom.locales?.[0]?.nombre ?? "",
        localbi_id: dom.locales?.[0]?.localbi_id ?? "",
        unidad_negocio: unidadNegocio,
        unidad_nombre: ficha.unidadnegocio_nombre || unidadNombre,
        segmento: ficha.segmento || segmento,
        coincidencia: `Unidad: ${unidadNegocio}`,
      }));
    } catch {
      return [];
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
