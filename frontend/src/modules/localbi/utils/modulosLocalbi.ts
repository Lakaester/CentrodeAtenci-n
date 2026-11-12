/**
 * Agregado de módulos que entrega LocalBI por local.
 *
 * LocalBI calcula `porcentajemodulousa` como `cantidadmodulosusa / 9 * 100`
 * (verificado contra la API). El 9 es el denominador interno de LocalBI; COSE
 * no recibe el catálogo de módulos ni sus nombres. Esta constante debe
 * reemplazarse por el denominador que exponga Microservice cuando el contrato
 * real esté disponible.
 */
export const MODULOS_LOCALBI_TOTAL = 9;

export function numeroModulosLocalbi(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Porcentaje para la barra visual. La fuente puede enviar el porcentaje; si no, se deriva. */
export function barraModulosLocalbi(
  cantidad: number | null,
  porcentaje: number | null,
): number {
  if (porcentaje != null) return Math.min(100, Math.max(0, porcentaje));
  if (cantidad == null) return 0;
  return Math.min(100, Math.max(0, (cantidad / MODULOS_LOCALBI_TOTAL) * 100));
}

/** Etiqueta exacta del agregado, sin inventar un desglose. */
export function etiquetaModulosLocalbi(
  cantidad: number | null,
  porcentaje: number | null,
): string {
  if (cantidad == null && porcentaje == null) return "No disponible";
  const n = cantidad == null ? "—" : String(cantidad);
  const p = porcentaje == null ? "—" : `${Math.round(porcentaje)}%`;
  return `${n}/${MODULOS_LOCALBI_TOTAL} · ${p}`;
}
