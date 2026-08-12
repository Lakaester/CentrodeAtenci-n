import type { AgentOverviewDTO } from "../dto/agent-overview.dto";

export const MOCK_AGENT_OVERVIEW_DTOS: AgentOverviewDTO[] = [
  { id: "SO-001", nombre: "María López", estado: "ocupado", canalPrincipal: "WhatsApp", conversacionesActivas: 5, slaPromedioPct: 92, ocupacionPct: 85, ultimaActividad: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: "SO-002", nombre: "Carlos Ruiz", estado: "ocupado", canalPrincipal: "WhatsApp", conversacionesActivas: 4, slaPromedioPct: 78, ocupacionPct: 72, ultimaActividad: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "SO-003", nombre: "Ana Martínez", estado: "disponible", canalPrincipal: "Correo", conversacionesActivas: 2, slaPromedioPct: 95, ocupacionPct: 35, ultimaActividad: new Date(Date.now() - 1 * 60000).toISOString() },
  { id: "SO-004", nombre: "Jorge Castillo", estado: "pausa", canalPrincipal: "Correo", conversacionesActivas: 3, slaPromedioPct: 88, ocupacionPct: 50, ultimaActividad: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "SO-005", nombre: "Sofía Vega", estado: "ocupado", canalPrincipal: "WhatsApp", conversacionesActivas: 6, slaPromedioPct: 81, ocupacionPct: 90, ultimaActividad: new Date(Date.now() - 3 * 60000).toISOString() },
  { id: "SO-006", nombre: "Diego Ramos", estado: "offline", canalPrincipal: "Correo", conversacionesActivas: 0, slaPromedioPct: 0, ocupacionPct: 0, ultimaActividad: new Date(Date.now() - 120 * 60000).toISOString() },
];
