import type { ConversationDTO } from "../dto/conversation.dto";

export const MOCK_CONVERSATION_DTOS: ConversationDTO[] = [
  { id: "C-001", cliente: "Carlos Mendoza", canal: "WhatsApp", asesor: "María López", estado: "en-curso", tiempoColaMin: 5, tiempoAtencionMin: 12, prioridad: "alta", ultimoMensaje: "Necesito mi factura urgente" },
  { id: "C-002", cliente: "Ana Torres", canal: "Correo", asesor: null, estado: "pendiente-asignacion", tiempoColaMin: 45, tiempoAtencionMin: 0, prioridad: "alta", ultimoMensaje: "No he recibido el comprobante" },
  { id: "C-003", cliente: "Pedro García", canal: "WhatsApp", asesor: "Carlos Ruiz", estado: "en-curso", tiempoColaMin: 3, tiempoAtencionMin: 8, prioridad: "alta", ultimoMensaje: "El enlace no funciona" },
  { id: "C-004", cliente: "Lucía Fernández", canal: "Correo", asesor: "Ana Martínez", estado: "en-curso", tiempoColaMin: 10, tiempoAtencionMin: 20, prioridad: "media", ultimoMensaje: "Gracias por la información" },
  { id: "C-005", cliente: "Roberto Sánchez", canal: "WhatsApp", asesor: "María López", estado: "esperando-respuesta", tiempoColaMin: 2, tiempoAtencionMin: 5, prioridad: "media", ultimoMensaje: "¿Podría confirmar el horario?" },
  { id: "C-006", cliente: "María Flores", canal: "Correo", asesor: null, estado: "pendiente-asignacion", tiempoColaMin: 120, tiempoAtencionMin: 0, prioridad: "baja", ultimoMensaje: "Consulta sobre mi plan actual" },
];
