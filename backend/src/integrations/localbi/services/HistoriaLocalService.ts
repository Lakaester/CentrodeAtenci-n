/**
 * HistoriaLocalService — Historia Clínica de un LOCAL específico.
 *
 * Identificador técnico interno: localbi_id (Nivel 1). Nunca se expone visualmente.
 *
 * Relaciones (mapeo auditado):
 *   FUENTE            CAMPO              RELACIÓN            NIVEL
 *   LocalBI (ficha)   localbi_id         identidad del local  1
 *   v_unificado_norm  localbi_id         atenciones por local 1
 *   Tareabi           tarea_localbi_id   tickets/tareas       1
 *   v_unificado_norm  dominio            atenciones por dom.  2 (solo si no hay localbi_id)
 *   incidencias       suscripcion (dom)  soporte por dominio  2 (no asigna a local: no tiene localbi_id)
 *   Q/D / facturación dominio            nivel cliente        2
 *
 * El local se selecciona por localbi_id. Los datos por dominio se marcan como
 * pertenecientes al dominio y NO se reparten entre locales.
 */
import { actividadCopeRepository } from "../../../repositories/actividadCope.repository";
import { soporteOnlineRepository, normalizarDominio } from "../../../repositories/soporteOnline.repository";
import type { LocalbiHistoriaClinica, LocalbiLocal } from "../../../integrations/localbi/types";

export interface HistoriaLocalResult {
  localbi_id: string;
  dominio: string | null;
  // Resumen del local (de la ficha LocalBI)
  local: LocalbiLocal | null;
  // Actividad COPE por localbi_id (Nivel 1)
  actividadLocal: { resumen: unknown; detalle: unknown[] };
  // Actividad COPE por dominio (Nivel 2, solo cuando no se pudo por local)
  actividadDominio: { resumen: unknown; detalle: unknown[] } | null;
  // Soporte en Línea por dominio (Nivel 2)
  soporte: { resumen: unknown; ultimasIncidencias: unknown[] } | null;
  // Tickets y tareas del local (de la ficha LocalBI)
  tickets: unknown[];
  tareasSueltas: unknown[];
  // NPS del local
  nps: unknown;
  // Disponibilidad por fuente
  disponible: {
    actividadLocal: boolean;
    actividadDominio: boolean;
    soporte: boolean;
    tickets: boolean;
  };
}

export const historiaLocalService = {
  /**
   * Historia del Local por localbi_id dentro de una ficha de unidad de negocio.
   * `ficha` viene de LocalBI; `localbiId` identifica el local.
   */
  async getHistoriaLocal(ficha: LocalbiHistoriaClinica, localbiId: string): Promise<HistoriaLocalResult | null> {
    // Buscar el local por localbi_id en la ficha.
    let local: LocalbiLocal | null = null;
    let dominio = "";
    for (const d of ficha.dominios ?? []) {
      const loc = (d.locales ?? []).find((l) => l.localbi_id === localbiId);
      if (loc) { local = loc; dominio = d.dominio; break; }
    }
    if (!local) return null;

    const domNorm = normalizarDominio(dominio || local.link_dominio);

    // 1) Actividad por localbi_id (Nivel 1)
    const actividadLocal = await actividadCopeRepository.actividadPorLocalbiId(localbiId);
    const tieneActividadLocal = actividadLocal.resumen.total > 0;

    // 2) Actividad por dominio (Nivel 2) solo como complemento si no hay por local
    let actividadDominio = null;
    if (!tieneActividadLocal && domNorm) {
      const porDom = await actividadCopeRepository.resumenPorDominios([domNorm]);
      const det = await actividadCopeRepository.detallePorDominios([domNorm], 30);
      const resumen = porDom[domNorm] ?? { total: 0, canales: [], categorias: [], subcategorias: [], asesores: [], estados: [], primera_atencion: null, ultima_atencion: null };
      actividadDominio = { resumen, detalle: det[domNorm] ?? [] };
    }

    // 3) Soporte en Línea por dominio (Nivel 2; incidencias no tiene localbi_id)
    let soporte = null;
    if (domNorm) {
      const s = await soporteOnlineRepository.resumenPorDominios([domNorm], "todo");
      const resumen = s.resumenes[domNorm];
      if (resumen && resumen.total > 0) {
        soporte = { resumen, ultimasIncidencias: s.ultimas[domNorm] ?? [] };
      }
    }

    // 4) Tickets y tareas del local (de la ficha LocalBI)
    const tickets = local.tickets ?? [];
    const tareasSueltas = local.tareas_sueltas ?? [];

    return {
      localbi_id: localbiId,
      dominio: domNorm || null,
      local,
      actividadLocal: { resumen: actividadLocal.resumen, detalle: actividadLocal.detalle },
      actividadDominio,
      soporte,
      tickets,
      tareasSueltas,
      nps: local.nps ?? null,
      disponible: {
        actividadLocal: tieneActividadLocal,
        actividadDominio: !!actividadDominio,
        soporte: !!soporte,
        tickets: tickets.length > 0 || tareasSueltas.length > 0,
      },
    };
  },
};
