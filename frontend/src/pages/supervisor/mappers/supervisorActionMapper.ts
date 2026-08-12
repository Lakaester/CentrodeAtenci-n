import { getCategoryConfig, PRIORITY_ORDER } from "../registry/supervisorActionConfig";
import type { SupervisorActionDTO } from "../dto/supervisor-action.dto";

export interface SupervisorActionUI {
  id: string;
  nombre: string;
  descripcion: string;
  categoryLabel: string;
  categoryColor: string;
  prioridad: string;
  priorityOrder: number;
  habilitada: boolean;
  iconKey: string;
}

export function mapAction(dto: SupervisorActionDTO): SupervisorActionUI {
  const cc = getCategoryConfig(dto.categoria);
  return {
    id: dto.id,
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    categoryLabel: cc.label,
    categoryColor: cc.color,
    prioridad: dto.prioridad,
    priorityOrder: PRIORITY_ORDER[dto.prioridad] ?? 2,
    habilitada: dto.habilitada,
    iconKey: dto.iconKey,
  };
}

export function mapActions(dtos: SupervisorActionDTO[]): SupervisorActionUI[] {
  return dtos.map(mapAction).sort((a, b) => a.priorityOrder - b.priorityOrder);
}
