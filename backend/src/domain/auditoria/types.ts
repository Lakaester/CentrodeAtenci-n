export type AccionAuditable =
  | "CREAR"
  | "ACTUALIZAR"
  | "ELIMINAR"
  | "ASIGNAR"
  | "TRANSFERIR"
  | "RESOLVER"
  | "CERRAR"
  | "REABRIR"
  | "CATEGORIZAR"
  | "ENVIAR_MENSAJE";

export type EntidadAuditable = "Caso" | "Cliente" | "Mensaje" | "Conversacion" | "Diagnostico" | "Resolucion";

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: AccionAuditable;
  entidad: EntidadAuditable;
  entidadId: string;
  valorAnterior?: Record<string, unknown>;
  valorNuevo?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}
