import type { AgentDTO } from "../dto/agent.dto";

export const MOCK_AGENT_DTOS: AgentDTO[] = [
  { id: "A-001", nombre: "María López", estado: "disponible", canal: "WhatsApp", carga: 3, conversacionesActivas: 2 },
  { id: "A-002", nombre: "Carlos Ruiz", estado: "ocupado", canal: "WhatsApp", carga: 8, conversacionesActivas: 5 },
  { id: "A-003", nombre: "Ana Martínez", estado: "disponible", canal: "Correo", carga: 2, conversacionesActivas: 1 },
  { id: "A-004", nombre: "Jorge Castillo", estado: "pausa", canal: "Correo", carga: 4, conversacionesActivas: 3 },
  { id: "A-005", nombre: "Sofía Vega", estado: "ocupado", canal: "WhatsApp", carga: 9, conversacionesActivas: 6 },
  { id: "A-006", nombre: "Diego Ramos", estado: "offline", canal: "Correo", carga: 0, conversacionesActivas: 0 },
];
