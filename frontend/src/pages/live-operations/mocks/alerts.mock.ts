import type { AlertDTO } from "../dto/alert.dto";

export const MOCK_ALERT_DTOS: AlertDTO[] = [
  { id: "ALT-001", tipo: "sla-vencido", severidad: "critica", titulo: "SLA vencido — Cliente Prioritario", descripcion: "El ticket de Carlos Mendoza (Facturación) superó el SLA de primera respuesta.", fechaHora: new Date().toISOString(), estado: "activa", accionSugerida: "Responder al cliente y escalar si es necesario." },
  { id: "ALT-002", tipo: "sla-proximo", severidad: "alta", titulo: "SLA próximo a vencer — 3 tickets", descripcion: "Tres tickets de WhatsApp están a menos de 5 minutos de incumplir el SLA.", fechaHora: new Date().toISOString(), estado: "activa", accionSugerida: "Priorizar respuesta en los tickets Q-001, Q-003 y Q-005." },
  { id: "ALT-003", tipo: "cola-saturada", severidad: "alta", titulo: "Cola de WhatsApp saturada", descripcion: "La cola de WhatsApp tiene 12 tickets sin asignar.", fechaHora: new Date().toISOString(), estado: "activa", accionSugerida: "Reasignar agentes disponibles al canal WhatsApp." },
  { id: "ALT-004", tipo: "asesor-sobrecargado", severidad: "media", titulo: "Carlos Ruiz al 90% de capacidad", descripcion: "El asesor Carlos Ruiz tiene 6 conversaciones activas simultáneas.", fechaHora: new Date().toISOString(), estado: "activa", accionSugerida: "Distribuir carga entrante a otros asesores disponibles." },
  { id: "ALT-005", tipo: "canal-alta-demanda", severidad: "media", titulo: "Canal Correo con alta demanda", descripcion: "El volumen de correos aumentó 40% en la última hora.", fechaHora: new Date().toISOString(), estado: "activa", accionSugerida: "Evaluar si se requiere personal adicional en el canal Correo." },
];
