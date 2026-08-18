export { useLocalbiSearch } from "./hooks/useLocalbiSearch";
export { useHistoriaClinica, useActividadCliente, useSoporteOnline } from "./hooks/useHistoriaClinica";
export { localbiService } from "./services/LocalbiService";
export type { LocalbiApiResult } from "./services/LocalbiService";
export type {
  LocalbiHistoriaClinica,
  LocalbiUnidadNegocio,
  LocalbiDominio,
  LocalbiLocal,
  LocalbiTicket,
  LocalbiTarea,
  LocalbiResumen,
  LocalbiKam,
  ActividadDominio,
  ActividadResumen,
  AtencionActividad,
  ActividadAgrupada,
  SoporteOnlineResult,
  SoporteOnlineDominio,
  SoporteResumen,
  Incidencia,
} from "./types/localbi";
