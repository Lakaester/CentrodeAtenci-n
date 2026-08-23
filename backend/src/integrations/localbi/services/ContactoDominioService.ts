/**
 * ContactoDominioService — capa de aplicación para CONTACTO ↔ DOMINIO.
 *
 * Orquesta: resolución de identidad (dominio/contacto) + consulta LocalBI
 * (homologación) + persistencia en contacto_identidad / contacto_dominio.
 *
 * El dominio NO conoce LocalBI (ContactoResolucionService es independiente);
 * es esta capa la que consulta LocalBI y decide si el dominio está homologado.
 *
 * CONTRATO REAL DE LOCALBI (auditado):
 *  - getUnidadesNegocioBusqueda(busqueda) → LocalbiUnidadNegocio[] con
 *    unidad_negocio, nombre, paises, cs, total_locales... NO incluye el dominio
 *    completo (cafeti.restaurant.pe).
 *  - getHistoriaClinica(unidad) → LocalbiHistoriaClinica con dominios[].dominio
 *    (dominio completo) y locales[].link_dominio.
 *
 * Por tanto, la homologación EXACTA del dominio solo es posible comparando
 * dominios[].dominio de la Historia Clínica de los candidatos, NO el buscador.
 * Si no se puede confirmar coincidencia exacta → DOMINIO_NO_HOMOLOGADO.
 */
import {
  contactoDominioRepository,
  type ContactoTipo,
  type DominioVinculado,
  type ContactoDominioOrigen,
} from "../../../repositories/contactoDominio.repository";
import { resolverIdentidad, type ResultadoResolucion } from "../../../domain/contacto/ContactoResolucionService";
import {
  normalizeDomain,
  isValidDomainFormat,
  normalizeContactIdentifier,
} from "../../../domain/contacto/normalizacion";
import { LocalbiService } from "./LocalbiService";
import type { LocalbiHistoriaClinica } from "../types";

export type { ContactoTipo };

const localbi = new LocalbiService();

export interface ContactoDominioResultado {
  tipo: ContactoTipo;
  valor_normalizado: string;
  dominios: DominioVinculado[];
}

export interface ResolverIdentidadSalida {
  tipo: ContactoTipo;
  valor_normalizado: string;
  estado: ResultadoResolucion["estado"];
  dominios: DominioVinculado[];
  dominioSeleccionado: string | null;
  origen: string | null;
  cliente?: {
    unidadNegocio: string;
    nombre: string;
    localbi_id: string | null;
    totalLocales: number;
  } | null;
  mensaje?: string;
}

/**
 * Homologa un dominio consultando LocalBI (coincidencia EXACTA con el dominio
 * de la Historia Clínica). Devuelve la unidad de negocio si hay coincidencia.
 *
 * Reglas:
 *  - El subdominio SOLO descubre candidatos; nunca es homologación por sí mismo.
 *  - Se deduplican candidatos por unidad_negocio antes de consultar historia.
 *  - Límite documentado de consultas a Historia Clínica (MAX_CANDIDATOS_HISTORIA).
 *  - Comparación final: normalizeDomain(ingresado) === normalizeDomain(historia).
 *  - Varias coincidencias exactas → REQUIERE_SELECCION.
 */
const MAX_CANDIDATOS_HISTORIA = 10;

interface Homologacion {
  estado: "HOMOLOGADO" | "REQUIERE_SELECCION" | "NO_HOMOLOGADO" | "NO_DISPONIBLE";
  unidad?: { unidad: string; nombre: string; localbiId: string | null; totalLocales: number };
}

async function homologarDominio(dominio: string): Promise<Homologacion> {
  const d = normalizeDomain(dominio);
  if (!d || !isValidDomainFormat(d)) return { estado: "NO_HOMOLOGADO" };

  const subdominio = d.split(".")[0];
  const candidatos = await localbi.buscarUnidades(subdominio, 1, 50);
  if (candidatos.status === "unavailable" || candidatos.status === "not_configured") {
    return { estado: "NO_DISPONIBLE" };
  }
  if (candidatos.status === "error") return { estado: "NO_HOMOLOGADO" };

  const unidades = candidatos.status === "success" || candidatos.status === "warning" ? candidatos.data.unidades : [];

  // Deduplicar por unidad_negocio y acotar el número de consultas.
  const vistos = new Set<string>();
  const candidatosUnicos: { unidad: string; nombre: string; total_locales: number }[] = [];
  for (const u of unidades) {
    if (vistos.has(u.unidad_negocio)) continue;
    vistos.add(u.unidad_negocio);
    candidatosUnicos.push({ unidad: u.unidad_negocio, nombre: u.nombre, total_locales: u.total_locales ?? 0 });
    if (candidatosUnicos.length >= MAX_CANDIDATOS_HISTORIA) break;
  }

  // Consultar Historia Clínica de cada candidato y buscar coincidencia EXACTA.
  const coincidencias: Homologacion["unidad"][] = [];
  for (const c of candidatosUnicos) {
    const hist = await localbi.obtenerHistoria(c.unidad);
    if (hist.status !== "success" && hist.status !== "warning") continue;
    const ficha = hist.data as LocalbiHistoriaClinica;
    const dominiosFicha = (ficha.dominios ?? []).map((x) => x.dominio).map(normalizeDomain).filter(Boolean);
    const dominiosSet = new Set(dominiosFicha); // un dominio repetido cuenta como una coincidencia
    if (dominiosSet.has(d)) {
      const locales = (ficha.dominios ?? []).flatMap((x) => x.locales ?? []);
      coincidencias.push({
        unidad: c.unidad,
        nombre: ficha.unidadnegocio_nombre || c.nombre,
        localbiId: locales[0]?.localbi_id ?? null,
        totalLocales: locales.length || c.total_locales,
      });
    }
  }

  if (coincidencias.length === 0) return { estado: "NO_HOMOLOGADO" };
  if (coincidencias.length > 1) return { estado: "REQUIERE_SELECCION", unidad: coincidencias[0] };
  return { estado: "HOMOLOGADO", unidad: coincidencias[0] };
}

export const contactoDominioService = {
  /**
   * RESOLVER — determina el dominio homologado de un contacto.
   * NO vincula ni guarda relación (la vinculación es una acción separada).
   * - Consulta los dominios activos del contacto.
   * - Si viene dominio explícito, lo homologa en LocalBI (coincidencia exacta).
   * - Usa el motor de resolución del dominio.
   * - Registra uso solo si el dominio resuelto ya estaba vinculado al contacto.
   */
  async resolver(tipo: ContactoTipo, valor: string, opts?: { dominioExplicito?: string | null; dominioHilo?: string | null; usuario?: string | null }): Promise<ResolverIdentidadSalida> {
    const valorNorm = normalizeContactIdentifier(tipo, valor);
    const dominios = await contactoDominioRepository.obtenerDominios(tipo, valorNorm);

    let homologado: boolean | undefined;
    let requiereSeleccion = false;
    let localbiNoDisponible = false;
    let unidad: ResolverIdentidadSalida["cliente"] = null;

    // Si hay dominio explícito válido, homologar en LocalBI.
    if (opts?.dominioExplicito) {
      const d = normalizeDomain(opts.dominioExplicito);
      if (isValidDomainFormat(d)) {
        const h = await homologarDominio(d);
        if (h.estado === "HOMOLOGADO" && h.unidad) {
          homologado = true;
          unidad = {
            unidadNegocio: h.unidad.unidad,
            nombre: h.unidad.nombre,
            localbi_id: h.unidad.localbiId,
            totalLocales: h.unidad.totalLocales,
          };
        } else if (h.estado === "REQUIERE_SELECCION") {
          requiereSeleccion = true;
          homologado = false;
        } else if (h.estado === "NO_DISPONIBLE") {
          localbiNoDisponible = true;
        } else {
          homologado = false;
        }
      }
    }

    const resultado = resolverIdentidad({
      tipo,
      valor,
      dominioExplicito: opts?.dominioExplicito,
      dominioHilo: opts?.dominioHilo,
      dominios: dominios.map((d) => ({ dominio: d.dominio, origen: d.origen })),
      homologado,
    });

    let estado = resultado.estado;
    let mensaje = resultado.mensaje;

    // Si LocalBI no estuvo disponible y el dominio explícito no estaba vinculado,
    // el resultado es indeterminado.
    if (localbiNoDisponible && !dominios.some((x) => x.dominio === resultado.dominioSeleccionado)) {
      estado = "LOCALBI_NO_DISPONIBLE";
      mensaje = "No se pudo confirmar el dominio en LocalBI. Inténtalo nuevamente.";
    } else if (requiereSeleccion) {
      estado = "REQUIERE_SELECCION";
      mensaje = "El dominio coincide con varias unidades de negocio. Selecciona una.";
    } else if (homologado === false && opts?.dominioExplicito && !dominios.some((x) => x.dominio === normalizeDomain(opts.dominioExplicito!))) {
      estado = "DOMINIO_NO_HOMOLOGADO";
      mensaje = "El dominio tiene un formato válido, pero no se encontró información en LocalBI.";
    }

    // Registrar uso solo si el dominio resuelto ya estaba vinculado (no crea relación).
    if (resultado.dominioSeleccionado && dominios.some((x) => x.dominio === resultado.dominioSeleccionado)) {
      await contactoDominioRepository.registrarUso(tipo, valorNorm, resultado.dominioSeleccionado);
    }

    return {
      tipo: resultado.tipo,
      valor_normalizado: resultado.valor_normalizado,
      estado,
      dominios,
      dominioSeleccionado: resultado.dominioSeleccionado,
      origen: resultado.origen,
      cliente: resultado.dominioSeleccionado ? unidad : null,
      mensaje,
    };
  },

  /**
   * Vincula (o reactiva) un dominio a un contacto. Opcionalmente homologa en
   * LocalBI. Registra origen y usuario.
   */
  async vincular(tipo: ContactoTipo, valor: string, dominio: string, usuario: string | null, origen: ContactoDominioOrigen = "MANUAL"): Promise<ContactoDominioResultado> {
    const guardado = await contactoDominioRepository.vincularDominio(tipo, valor, dominio, usuario, origen);
    if (!guardado) {
      throw new Error("El dominio no tiene un formato válido.");
    }
    const dominios = await contactoDominioRepository.obtenerDominios(tipo, valor);
    return { tipo, valor_normalizado: normalizeContactIdentifier(tipo, valor), dominios };
  },

  /** Desactiva un dominio de un contacto. */
  async desvincular(tipo: ContactoTipo, valor: string, dominio: string): Promise<ContactoDominioResultado> {
    await contactoDominioRepository.desvincularDominio(tipo, valor, dominio);
    const dominios = await contactoDominioRepository.obtenerDominios(tipo, valor);
    return { tipo, valor_normalizado: normalizeContactIdentifier(tipo, valor), dominios };
  },

  /** Dominios activos de un contacto. */
  async obtener(tipo: ContactoTipo, valor: string): Promise<ContactoDominioResultado> {
    const dominios = await contactoDominioRepository.obtenerDominios(tipo, valor);
    return { tipo, valor_normalizado: normalizeContactIdentifier(tipo, valor), dominios };
  },

  /** Expone la normalización canónica (para que Zendesk/Panel la reutilicen). */
  normalizarDominio(d: string | null | undefined): string {
    return normalizeDomain(d);
  },
};
