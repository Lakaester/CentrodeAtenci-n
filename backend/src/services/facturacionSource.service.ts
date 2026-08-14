import type { FacturacionSourceStatus } from "../integrations/facturacion/FacturacionSource";

/**
 * FacturacionSourceService — expone el estado de la fuente de facturación.
 *
 * Actualmente NO existe adapter concreto (no hay acceso autorizado a
 * facturacionbi). Por tanto la fuente está en estado NO_CONECTADA.
 * Cuando se implemente el adapter, este servicio delegará en él.
 */
export const facturacionSourceService = {
  async status(): Promise<FacturacionSourceStatus> {
    return {
      estado: "NO_CONECTADA",
      mensaje: "La fuente de facturación está pendiente de conexión.",
    };
  },
};
