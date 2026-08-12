/**
 * Clasificador especifico para el reporte "Quejas y Devoluciones".
 *
 * REGLA CANONICA (definida en FASE 2):
 *   QUEJA       → categoria normalizada = "gestion" AND subcategoria normalizada = "queja"
 *   DEVOLUCION  → categoria normalizada = "gestion" AND subcategoria normalizada = "solicitud de devolucion"
 *
 * Normalizacion: trim, lowercase, _ → espacio, normalizar espacios, strippear acentos.
 *
 * NOTA: Esta clasificacion es ESPECIFICA del reporte. No modifica la homologacion global.
 */

export function normalizeSubcategory(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function classifyComplaintOrReturn(
  categoria: string,
  subcategoria: string,
): "QUEJA" | "DEVOLUCION" | null {
  const cat = normalizeSubcategory(categoria);
  const sub = normalizeSubcategory(subcategoria);

  if (cat !== "gestion") return null;
  if (sub === "queja") return "QUEJA";
  if (sub === "solicitud de devolucion") return "DEVOLUCION";
  return null;
}
