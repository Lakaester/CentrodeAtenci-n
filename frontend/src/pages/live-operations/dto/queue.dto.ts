export interface QueueItemDTO {
  id: string;
  cliente: string;
  canal: string;
  prioridad: "alta" | "media" | "baja";
  tiempoEsperaMin: number;
  estado: string;
  slaMin: number;
  asignado: string | null;
}
