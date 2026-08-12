import type { ActivityDTO } from "../dto/activity.dto";

const now = Date.now();

export const MOCK_ACTIVITY_DTOS: ActivityDTO[] = [
  { id: "ACT-001", type: "ticket-created",  title: "Ticket creado",         description: "Carlos Mendoza abrió un nuevo ticket de facturación",                 user: "Carlos Mendoza",  timestamp: new Date(now - 2 * 60000).toISOString(),       priority: "alta",  status: "pendiente",   iconKey: "fileText" },
  { id: "ACT-002", type: "ticket-closed",   title: "Ticket resuelto",       description: "María López resolvió el ticket de Pedro García",                     user: "María López",     timestamp: new Date(now - 5 * 60000).toISOString(),       priority: "media", status: "completada", iconKey: "checkCircle" },
  { id: "ACT-003", type: "mention",         title: "Mención recibida",      description: "Carlos Ruiz te mencionó en la nota del ticket Q-003",                user: "Carlos Ruiz",     timestamp: new Date(now - 10 * 60000).toISOString(),      priority: "alta",  status: "pendiente",   iconKey: "atSign" },
  { id: "ACT-004", type: "assignment",      title: "Ticket asignado",       description: "Se asignó el ticket C-005 a María López",                            user: "Sistema",         timestamp: new Date(now - 15 * 60000).toISOString(),      priority: "media", status: "completada", iconKey: "userCheck" },
  { id: "ACT-005", type: "note-added",      title: "Nota interna agregada", description: "Ana Martínez agregó una nota interna al ticket de Lucía Fernández",  user: "Ana Martínez",    timestamp: new Date(now - 30 * 60000).toISOString(),      priority: "baja",  status: "completada", iconKey: "fileText" },
  { id: "ACT-006", type: "queue-alert",     title: "Cola de WhatsApp crítica", description: "La cola de WhatsApp superó los 15 tickets sin asignar",            user: "Sistema",         timestamp: new Date(now - 60 * 60000).toISOString(),      priority: "alta",  status: "pendiente",   iconKey: "alertTriangle" },
  { id: "ACT-007", type: "ticket-reopened", title: "Ticket reabierto",      description: "Roberto Sánchez reabrió su ticket por insatisfacción",              user: "Roberto Sánchez", timestamp: new Date(now - 120 * 60000).toISOString(),     priority: "alta",  status: "pendiente",   iconKey: "rotateCcw" },
  { id: "ACT-008", type: "version-update",  title: "Actualización del sistema", description: "COPE v2.4.1 desplegada en producción",                              user: "Sistema",         timestamp: new Date(now - 240 * 60000).toISOString(),     priority: "baja",  status: "completada", iconKey: "package" },
];
