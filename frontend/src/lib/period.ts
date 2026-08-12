/**
 * Determina si el periodo consultado es historico (termino antes del dia actual).
 *
 * "At. en proceso" depende del estado_homologado actual del ticket en v_unificado_norm.
 * Para periodos cerrados (ej: julio 2026 consultado en agosto), el estado actual ya no
 * refleja el estado real al cierre del periodo. Se oculta el indicador hasta disponer
 * de un motor de estados historicos (ver docs/architecture/historical-engine.md).
 */
export function isHistoricalPeriod(fechaHoraFin?: string): boolean {
  if (!fechaHoraFin) return false;
  const fin = new Date(fechaHoraFin.replace(" ", "T"));
  if (isNaN(fin.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fin < hoy;
}
