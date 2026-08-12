export type ActionCategory = "asignacion" | "escalamiento" | "supervision" | "historial" | "seguimiento";

export type ActionPriority = "alta" | "media" | "baja";

export interface SupervisorActionDTO {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: ActionCategory;
  prioridad: ActionPriority;
  habilitada: boolean;
  iconKey: string;
}
