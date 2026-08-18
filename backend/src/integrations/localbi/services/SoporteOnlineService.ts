/**
 * SoporteOnlineService — Soporte en Línea (public.incidencias) para la Historia Clínica.
 * Vínculo oficial: incidencias.suscripcion (dominio) → localbi.link_dominio.
 */
import {
  soporteOnlineRepository,
  normalizarDominio,
  type SoporteResumen,
  type IncidenciaRow,
} from "../../../repositories/soporteOnline.repository";

export interface SoporteOnlineDominio {
  dominio: string;
  resumen: SoporteResumen;
  ultimasIncidencias: IncidenciaRow[];
}

export interface SoporteOnlineResult {
  porDominio: SoporteOnlineDominio[];
  nombreLocalPorDominio: Record<string, string>;
  totalIncidencias: number;
}

export const soporteOnlineService = {
  /** Soporte en Línea para una lista de dominios (de la ficha LocalBI). */
  async obtenerSoporteOnline(dominios: string[], periodo?: string): Promise<SoporteOnlineResult> {
    const limpios = [...new Set(dominios.map(normalizarDominio).filter(Boolean))];
    const [datos, nombres] = await Promise.all([
      soporteOnlineRepository.resumenPorDominios(limpios, periodo),
      soporteOnlineRepository.nombreLocalPorDominio(limpios),
    ]);

    const porDominio = limpios.map((dominio) => ({
      dominio,
      resumen: datos.resumenes[dominio] ?? {
        total: 0,
        abiertas: 0,
        cerradas: 0,
        primera_incidencia: null,
        ultima_incidencia: null,
        prom_espera_min: null,
        prom_solucion_min: null,
        categorias: [],
        estados: [],
        porLocal: [],
      },
      ultimasIncidencias: datos.ultimas[dominio] ?? [],
    }));

    return {
      porDominio,
      nombreLocalPorDominio: nombres,
      totalIncidencias: porDominio.reduce((acc, d) => acc + d.resumen.total, 0),
    };
  },
};
