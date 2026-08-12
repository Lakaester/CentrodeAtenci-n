export type CategoriaEvento =
  | "CLIENTE"
  | "ASESOR"
  | "SISTEMA"
  | "HERRAMIENTA"
  | "DESARROLLO";

/* ── CLIENTE ── */
export const CLIENTE = {
  ESCRIBIO: "cliente_escribio",
  RESPONDIO: "cliente_respondio",
  ENVIO_ARCHIVO: "cliente_envio_archivo",
  LEYO_RESPUESTA: "cliente_leyo_respuesta",
} as const;

/* ── ASESOR ── */
export const ASESOR = {
  CASO_ACEPTADO: "caso_aceptado",
  MENSAJE_ENVIADO: "mensaje_enviado",
  CATEGORIA_ASIGNADA: "categoria_asignada",
  SUBCATEGORIA_ASIGNADA: "subcategoria_asignada",
  CASO_RESUELTO: "caso_resuelto",
  CASO_CERRADO: "caso_cerrado",
  CASO_TRANSFERIDO: "caso_transferido",
  CASO_REASIGNADO: "caso_reasignado",
  NOTA_INTERNA: "nota_interna",
} as const;

/* ── SISTEMA ── */
export const SISTEMA = {
  CASO_CREADO: "caso_creado",
  SLA_INICIADO: "sla_iniciado",
  SLA_VENCIDO: "sla_vencido",
  PLAYBOOK_INICIADO: "playbook_iniciado",
  DIAGNOSTICO_INICIADO: "diagnostico_iniciado",
  DIAGNOSTICO_COMPLETADO: "diagnostico_completado",
  WORKSPACE_ACTUALIZADO: "workspace_actualizado",
  MACRO_UTILIZADA: "macro_utilizada",
} as const;

/* ── HERRAMIENTAS ── */
export const HERRAMIENTA = {
  DOMINIO_ABIERTO: "dominio_abierto",
  MICROSERVICE_ABIERTO: "microservice_abierto",
  RESTAFACT_ABIERTO: "restafact_abierto",
  MONITOR_ABIERTO: "monitor_integraciones_abierto",
  DASHBOARD_FE_ABIERTO: "dashboard_fe_abierto",
  DASHBOARD_CHILE_ABIERTO: "dashboard_chile_abierto",
  NOTEBOOKLM_ABIERTO: "notebooklm_abierto",
  POSTMAN_ABIERTO: "postman_abierto",
} as const;

/* ── DESARROLLO ── */
export const DESARROLLO = {
  TICKET_DEV_CREADO: "ticket_dev_creado",
  TICKET_DEV_ACTUALIZADO: "ticket_dev_actualizado",
  TICKET_DEV_CERRADO: "ticket_dev_cerrado",
} as const;

export const TIPOS_EVENTO = {
  ...CLIENTE,
  ...ASESOR,
  ...SISTEMA,
  ...HERRAMIENTA,
  ...DESARROLLO,
} as const;

export type TipoEventoTimeline = (typeof TIPOS_EVENTO)[keyof typeof TIPOS_EVENTO];

export const CATEGORIA_POR_TIPO: Record<string, CategoriaEvento> = {
  /* CLIENTE */
  [CLIENTE.ESCRIBIO]: "CLIENTE",
  [CLIENTE.RESPONDIO]: "CLIENTE",
  [CLIENTE.ENVIO_ARCHIVO]: "CLIENTE",
  [CLIENTE.LEYO_RESPUESTA]: "CLIENTE",
  /* ASESOR */
  [ASESOR.CASO_ACEPTADO]: "ASESOR",
  [ASESOR.MENSAJE_ENVIADO]: "ASESOR",
  [ASESOR.CATEGORIA_ASIGNADA]: "ASESOR",
  [ASESOR.SUBCATEGORIA_ASIGNADA]: "ASESOR",
  [ASESOR.CASO_RESUELTO]: "ASESOR",
  [ASESOR.CASO_CERRADO]: "ASESOR",
  [ASESOR.CASO_TRANSFERIDO]: "ASESOR",
  [ASESOR.CASO_REASIGNADO]: "ASESOR",
  [ASESOR.NOTA_INTERNA]: "ASESOR",
  /* SISTEMA */
  [SISTEMA.CASO_CREADO]: "SISTEMA",
  [SISTEMA.SLA_INICIADO]: "SISTEMA",
  [SISTEMA.SLA_VENCIDO]: "SISTEMA",
  [SISTEMA.PLAYBOOK_INICIADO]: "SISTEMA",
  [SISTEMA.DIAGNOSTICO_INICIADO]: "SISTEMA",
  [SISTEMA.DIAGNOSTICO_COMPLETADO]: "SISTEMA",
  [SISTEMA.WORKSPACE_ACTUALIZADO]: "SISTEMA",
  [SISTEMA.MACRO_UTILIZADA]: "SISTEMA",
  /* HERRAMIENTA */
  [HERRAMIENTA.DOMINIO_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.MICROSERVICE_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.RESTAFACT_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.MONITOR_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.DASHBOARD_FE_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.DASHBOARD_CHILE_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.NOTEBOOKLM_ABIERTO]: "HERRAMIENTA",
  [HERRAMIENTA.POSTMAN_ABIERTO]: "HERRAMIENTA",
  /* DESARROLLO */
  [DESARROLLO.TICKET_DEV_CREADO]: "DESARROLLO",
  [DESARROLLO.TICKET_DEV_ACTUALIZADO]: "DESARROLLO",
  [DESARROLLO.TICKET_DEV_CERRADO]: "DESARROLLO",
};
