/**
 * Normalización de CONTACTO y DOMINIO (COPE).
 *
 * Única fuente de verdad para normalizar dominios e identificadores de contacto
 * en todo el sistema. Reutilizada por el repositorio, el motor de resolución,
 * Zendesk, WhatsApp, el Panel Operativo y la reportería.
 *
 *  - normalizeDomain: devuelve SOLO el hostname (sin protocolo, path, query,
 *    fragment, slash final, espacios, mayúsculas).
 *  - normalizeContactIdentifier: normaliza email o teléfono/WhatsApp según tipo.
 *  - isValidDomainFormat: valida que el hostname tenga formato de dominio real.
 */

export type ContactoTipo = "email" | "whatsapp";

/**
 * Normaliza un dominio a su forma canónica (solo hostname).
 *
 *   http://cafeti.restaurant.pe/     → cafeti.restaurant.pe
 *   HTTPS://CAFETI.RESTAURANT.PE/    → cafeti.restaurant.pe
 *   https://cafeti.restaurant.pe/login → cafeti.restaurant.pe
 *   https://cafeti.restaurant.pe?foo=1 → cafeti.restaurant.pe
 *   cafeti.restaurant.pe/            → cafeti.restaurant.pe
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
 * Requiere al menos un punto y un TLD de 2+ letras; rechaza espacios,
 * protocolos sueltos, caracteres imposibles y hostnames sin dominio.
 */
export function isValidDomainFormat(hostname: string | null | undefined): boolean {
  const h = normalizeDomain(hostname);
  if (!h) return false;
  if (/\s/.test(h)) return false;                       // espacios internos
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(h)) return false; // estructura host.tld(.tld)
  if (!/^[a-z0-9-]+\./.test(h)) return false;           // debe tener subdominio/dominio antes del punto
  const tld = h.split(".").pop() ?? "";
  if (tld.length < 2) return false;                     // TLD mínimo
  if (h.length < 4) return false;
  return true;
}

/**
 * Normaliza un identificador de contacto según su tipo.
 *  - email:   lowercase + trim.
 *  - whatsapp: solo dígitos (sin +, espacios, guiones). Si el número parece
 *    local (9 dígitos) y no lleva código de país, se asume Perú (+51) para
 *    comparación consistente. NO inventa país si no hay suficiente información.
 */
export function normalizeContactIdentifier(tipo: ContactoTipo, valor: string | null | undefined): string {
  const v = (valor ?? "").trim();
  if (!v) return "";

  if (tipo === "email") {
    return v.toLowerCase();
  }

  // WhatsApp / teléfono: solo dígitos
  let digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  // Si son 9 dígitos (formato local peruano sin código de país), asumir +51.
  if (digits.length === 9) digits = "51" + digits;
  return digits;
}

/**
 * Determina si un valor es un email válido.
 */
export function esEmail(valor: string | null | undefined): boolean {
  const v = (valor ?? "").trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

/**
 * Determina si un valor parece un número de teléfono/WhatsApp (no email).
 */
export function pareceTelefono(valor: string | null | undefined): boolean {
  const v = (valor ?? "").trim();
  if (!v || v.includes("@")) return false;
  return /[0-9]{7,}/.test(v.replace(/[^\d]/g, ""));
}
