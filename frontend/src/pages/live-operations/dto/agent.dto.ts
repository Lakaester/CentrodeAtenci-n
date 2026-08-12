export interface AgentDTO {
  id: string;
  nombre: string;
  estado: "disponible" | "ocupado" | "pausa" | "offline";
  canal: string;
  carga: number;
  conversacionesActivas: number;
}
