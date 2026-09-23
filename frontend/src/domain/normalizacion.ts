/**
 * Normalización canónica de dominios para todo COPE (frontend).
 *
 * Fuente única de verdad para normalizar dominios en el frontend.
 * Equivalente a backend/src/domain/contacto/normalizacion.ts
 *
 *   http://cafeti.restaurant.pe/         → cafeti.restaurant.pe
 *   HTTPS://CAFETI.RESTAURANT.PE/        → cafeti.restaurant.pe
 *   https://cafeti.restaurant.pe/login   → cafeti.restaurant.pe
 *   https://cafeti.restaurant.pe?foo=1   → cafeti.restaurant.pe
 *   https://abc.quipupos.com/ruta        → abc.quipupos.com
 */

/**
 * Normaliza un dominio a su forma canónica (solo hostname).
 *
 * Elimina: protocolo, fragment (#), query string (?), path (/),
 * trailing slashes, trailing dots, espacios, mayúsculas.
 */
export function normalizeDomain(input: string | null | undefined): string {
  if (!input) return "";
  let v = String(input).trim().toLowerCase();
  // Quitar protocolo
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  // Quitar fragmento
  v = v.split("#")[0];
  // Quitar query string
  v = v.split("?")[0];
  // Quitar path (todo a partir de la primera barra)
  const slash = v.indexOf("/");
  if (slash !== -1) v = v.slice(0, slash);
  // Quitar slash/espacios finales y puntos sueltos
  v = v.replace(/\/+$/g, "").replace(/\s+/g, "").replace(/\.+$/g, "").trim();
  return v;
}

/**
 * Valida que un hostname tenga formato de dominio real.
 * Requiere al menos un punto y un TLD de 2+ letras.
 */
export function isValidDomainFormat(hostname: string | null | undefined): boolean {
  const h = normalizeDomain(hostname);
  if (!h) return false;
  if (/\s/.test(h)) return false;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(h)) return false;
  if (!/^[a-z0-9-]+\./.test(h)) return false;
  const tld = h.split(".").pop() ?? "";
  if (tld.length < 2) return false;
  if (h.length < 4) return false;
  return true;
}
