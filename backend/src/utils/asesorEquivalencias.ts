/**
 * Equivalencias explícitas de asesores para el reporte Categorías.
 *
 * Regla determinística: la clave es el nombre ORIGINAL exacto (trim) y el
 * valor es el asesor consolidado. No se usan coincidencias parciales, fuzzy
 * matching ni truncamiento al primer nombre.
 *
 * - Un nombre no listado se conserva como grupo propio (no se mezcla).
 * - Un nombre nulo o vacío se reporta como "Sin asignar".
 *
 * Esta tabla es local al reporte Categorías y no altera la consolidación de
 * otros reportes.
 */
export const ASESOR_SIN_ASIGNAR = "Sin asignar";

export const ASESOR_EQUIVALENCIAS: Record<string, string> = {
  Alex: "Alex López",
  "Alex Lopez": "Alex López",
  "Alex López": "Alex López",
  Eveling: "Eveling Lovera",
  "Eveling Lovera": "Eveling Lovera",
  Danilo: "Danilo Pena",
  "Danilo Pena": "Danilo Pena",
  "Danilo P": "Danilo Pena",
  Victor: "Victor Guevara",
  "Victor Guevara": "Victor Guevara",
  Lisbeth: "Lisbeth Huaman",
  "Lisbeth Huaman": "Lisbeth Huaman",
  Sheyla: "Sheyla Guevara",
  "Sheyla Guevara": "Sheyla Guevara",
  Lidia: "Lidia Ceferino",
  "Lidia Ceferino": "Lidia Ceferino",
  "Andrés": "Andres Espinoza Franco",
  "Andres Espinoza Franco": "Andres Espinoza Franco",
};

/** Devuelve el asesor consolidado o el nombre original si no tiene equivalencia. */
export function consolidarAsesor(original: string | null | undefined): string {
  const nombre = (original ?? "").trim();
  if (!nombre) return ASESOR_SIN_ASIGNAR;
  return ASESOR_EQUIVALENCIAS[nombre] ?? nombre;
}
