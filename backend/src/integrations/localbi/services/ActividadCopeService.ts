/**
 * ActividadCopeService — lógica de negocio de la actividad de COPE
 * (atenciones de v_unificado_norm) para enriquecer la Historia Clínica.
 */
import { actividadCopeRepository, normalizarDominioActividad, type ActividadResumen, type ActividadLocalRow } from "../../../repositories/actividadCope.repository";

export interface ActividadDominio {
  dominio: string;                    // dominio normalizado (clave)
  resumen: ActividadResumen;
  ultimasAtenciones: ActividadLocalRow[];
}

export const actividadCopeService = {
  /**
   * Actividad de COPE para una lista de dominios (de la ficha LocalBI).
   * Devuelve un objeto por dominio normalizado. Para dominios sin actividad,
   * el resumen queda con total 0 (el frontend muestra "Sin atenciones registradas").
   */
  async obtenerActividadPorDominios(dominios: string[], limite = 30): Promise<ActividadDominio[]> {
    const limpios = [...new Set(dominios.map(normalizarDominioActividad).filter(Boolean))];
    const [resumenes, detalle] = await Promise.all([
      actividadCopeRepository.resumenPorDominios(limpios),
      actividadCopeRepository.detallePorDominios(limpios, limite),
    ]);

    return limpios.map((dominio) => ({
      dominio,
      resumen: resumenes[dominio] ?? {
        total: 0,
        canales: [],
        categorias: [],
        subcategorias: [],
        asesores: [],
        estados: [],
        primera_atencion: null,
        ultima_atencion: null,
      },
      ultimasAtenciones: detalle[dominio] ?? [],
    }));
  },

  /**
   * Resumen de actividad por localbi_id (Nivel 1). Cada local obtiene su
   * propio total y última atención. Las atenciones sin localbi_id (NULL) NO
   * se asignan a ningún local.
   */
  async obtenerActividadPorLocales(localbiIds: string[]): Promise<Record<string, { total: number; ultima_atencion: string | null }>> {
    return actividadCopeRepository.resumenPorLocalbiIds(localbiIds);
  },
};
