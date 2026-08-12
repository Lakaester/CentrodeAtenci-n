export type AgentStatus = "disponible" | "ocupado" | "pausa" | "offline";

export interface AgentOverviewDTO {
  id: string;
  nombre: string;
  estado: AgentStatus;
  canalPrincipal: string;
  conversacionesActivas: number;
  slaPromedioPct: number;
  ocupacionPct: number;
  ultimaActividad: string;
}
