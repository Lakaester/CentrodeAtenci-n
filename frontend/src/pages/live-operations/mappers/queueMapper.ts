import type { QueueItemDTO } from "../dto/queue.dto";

export interface QueueItemUI {
  id: string;
  cliente: string;
  canal: string;
  prioridad: string;
  prioridadColor: string;
  tiempoEsperaMin: number;
  tiempoLabel: string;
  estado: string;
  slaMin: number;
  slaCritico: boolean;
  asignado: string | null;
}

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: "text-danger bg-danger-5",
  media: "text-warning bg-warning-5",
  baja: "text-success bg-success-5",
};

export function mapQueueItem(dto: QueueItemDTO): QueueItemUI {
  return {
    id: dto.id,
    cliente: dto.cliente,
    canal: dto.canal,
    prioridad: dto.prioridad,
    prioridadColor: PRIORIDAD_COLOR[dto.prioridad] ?? "text-black-45 bg-black-5",
    tiempoEsperaMin: dto.tiempoEsperaMin,
    tiempoLabel: dto.tiempoEsperaMin < 60
      ? `${dto.tiempoEsperaMin} min`
      : `${Math.floor(dto.tiempoEsperaMin / 60)}h ${dto.tiempoEsperaMin % 60}m`,
    estado: dto.estado,
    slaMin: dto.slaMin,
    slaCritico: dto.slaMin <= 15,
    asignado: dto.asignado,
  };
}

export function mapQueueItems(dtos: QueueItemDTO[]): QueueItemUI[] {
  return dtos.map(mapQueueItem);
}
