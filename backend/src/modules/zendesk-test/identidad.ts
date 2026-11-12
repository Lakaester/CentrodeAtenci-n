import type { Request } from "express";
import type { AuthedRequest } from "../../middlewares/auth.middleware";

export interface IdentidadUsuario {
  id: string;
  nombre: string;
  apellido: string | null;
  correo: string;
  nombreCompleto: string;
  /** Identidad textual estable para auditoría: "Nombre Apellido (id)". */
  etiqueta: string;
}

/**
 * Identidad autenticada real. No usa body.autor ni valores por defecto.
 * Si la sesión no tiene id o nombre, devuelve null (el caller debe responder 401).
 */
export function identidadDe(req: Request): IdentidadUsuario | null {
  const auth = (req as AuthedRequest).auth;
  if (!auth) return null;

  const id = String(auth.id ?? "").trim();
  const nombre = String(auth.nombre ?? "").trim();
  const apellido = auth.apellido != null ? String(auth.apellido).trim() : "";
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ").trim();

  if (!id || !nombre) return null;

  return {
    id,
    nombre,
    apellido: apellido || null,
    correo: auth.correo,
    nombreCompleto,
    etiqueta: `${nombreCompleto} (${id})`,
  };
}
