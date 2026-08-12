export type TipoEventoDominio =
  | "caso_creado"
  | "caso_asignado"
  | "caso_estado_cambiado"
  | "caso_resuelto"
  | "caso_cerrado"
  | "mensaje_recibido"
  | "mensaje_enviado"
  | "diagnostico_completado"
  | "sla_riesgo"
  | "categoria_asignada"
  | "herramienta_utilizada"
  | "playbook_ejecutado";

export interface EventoDominio {
  id: string;
  tipo: TipoEventoDominio;
  payload: Record<string, unknown>;
  origen: string;
  timestamp: string;
  correlationId?: string;
}

export interface SuscripcionEvento {
  tipo: TipoEventoDominio;
  handler: (evento: EventoDominio) => Promise<void>;
}
