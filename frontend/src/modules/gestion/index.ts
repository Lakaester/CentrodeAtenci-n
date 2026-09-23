export { apoyoService } from "./services/apoyoService";
export { agendaService } from "./services/agendaService";

export {
  useApoyoLista, useApoyoDetalle, useApoyoKpis, useApoyoCrear,
  useApoyoActualizar, useApoyoCerrar, useApoyoEliminar,
  useApoyoAreas, useApoyoAsesores,
  useApoyoCategoriasFun, useApoyoSubcategoriasDeCategoria,
  useApoyoExportar,
} from "./hooks/useApoyos";

export {
  useAgendaLista, useAgendaDetalle, useAgendaKpis, useAgendaCrear,
  useAgendaActualizar, useAgendaActualizarEstado, useAgendaEliminar,
  useAgendaPorRangoFecha, useAgendaExportar,
  useAgendaRegistrarInicioReal, useAgendaRegistrarFinReal,
  useAgendaSetResultado, useAgendaGuardarActa,
  useAgendaSincronizarCalendar, useAgendaReintentarSyncCalendar,
  useGoogleCalendarStatus, useGoogleCalendarConnect, useGoogleCalendarDisconnect,
  useGoogleCalendarInfo, useVerificarDisponibilidad, useReconciliarAgenda,
} from "./hooks/useAgendas";

export type {
  Apoyo, ApoyoEstado, ApoyoCategoria, ApoyoKpis, CrearApoyoInput, ActualizarApoyoInput,
  Agenda, AgendaTipo, AgendaEstado, AgendaResultado, AgendaKpis, CrearAgendaInput, ActualizarAgendaInput,
  ActaContenido, ActaParticipante, ActaAcuerdo, ActaEvidencia,
  AsesorInfo, CatalogoItem,
} from "./types";
