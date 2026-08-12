import type { QueueItemDTO } from "../dto/queue.dto";

export const MOCK_QUEUE_DTOS: QueueItemDTO[] = [
  { id: "Q-001", cliente: "Carlos Mendoza", canal: "WhatsApp", prioridad: "alta", tiempoEsperaMin: 12, estado: "Esperando 1ª respuesta", slaMin: 5, asignado: "María López" },
  { id: "Q-002", cliente: "Ana Torres", canal: "Correo", prioridad: "media", tiempoEsperaMin: 45, estado: "Pendiente asignación", slaMin: 120, asignado: null },
  { id: "Q-003", cliente: "Pedro García", canal: "WhatsApp", prioridad: "alta", tiempoEsperaMin: 8, estado: "En revisión", slaMin: 3, asignado: "Carlos Ruiz" },
  { id: "Q-004", cliente: "Lucía Fernández", canal: "Correo", prioridad: "baja", tiempoEsperaMin: 180, estado: "Pendiente", slaMin: 480, asignado: null },
  { id: "Q-005", cliente: "Roberto Sánchez", canal: "WhatsApp", prioridad: "media", tiempoEsperaMin: 20, estado: "Esperando 1ª respuesta", slaMin: 10, asignado: "María López" },
];
