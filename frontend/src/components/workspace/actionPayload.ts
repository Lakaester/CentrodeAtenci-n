/**
 * Construye el body de las acciones del workspace.
 *
 * La identidad (autor) proviene de la sesión autenticada en backend.
 * Ninguna acción envía `autor` desde el cliente.
 */
export function buildActionPayload(body?: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...(body ?? {}) };
  delete rest.autor;
  return rest;
}
