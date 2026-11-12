export { useLocalbiSearch } from "./hooks/useLocalbiSearch";
export { useHistoriaClinica, useActividadCliente, useActividadCose, useSoporteOnline, useHistoriaLocal, useActividadLocal } from "./hooks/useHistoriaClinica";
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
  CoseAtencion,
  CoseIndicadorTiempo,
  CoseResumen,
  CoseOpciones,
  CoseChips,
  CoseAgregada,
  SoporteOnlineResult,
  SoporteOnlineDominio,
  SoporteResumen,
  Incidencia,
  HistoriaLocal,
} from "./types/localbi";
