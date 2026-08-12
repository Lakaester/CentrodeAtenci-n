import type { SupervisorActionDTO } from "../dto/supervisor-action.dto";

export const MOCK_ACTION_DTOS: SupervisorActionDTO[] = [
  { id: "ACT-001", nombre: "Reasignar conversación", descripcion: "Transferir un ticket a otro asesor o cola", categoria: "asignacion", prioridad: "alta", habilitada: true, iconKey: "users" },
  { id: "ACT-002", nombre: "Escalar incidencia", descripcion: "Elevar un caso a un nivel superior de soporte", categoria: "escalamiento", prioridad: "alta", habilitada: true, iconKey: "alertTriangle" },
  { id: "ACT-003", nombre: "Supervisar asesor", descripcion: "Ingresar al workspace de un asesor para monitoreo en vivo", categoria: "supervision", prioridad: "media", habilitada: true, iconKey: "eye" },
  { id: "ACT-004", nombre: "Ver detalle de ticket", descripcion: "Abrir la vista completa de un ticket", categoria: "historial", prioridad: "media", habilitada: true, iconKey: "fileText" },
  { id: "ACT-005", nombre: "Abrir historial del cliente", descripcion: "Consultar el historial completo de interacciones", categoria: "historial", prioridad: "baja", habilitada: true, iconKey: "clock" },
  { id: "ACT-006", nombre: "Crear seguimiento", descripcion: "Agendar una actividad de seguimiento para un caso", categoria: "seguimiento", prioridad: "baja", habilitada: false, iconKey: "plusCircle" },
];
