export { Atencion, type AtencionData, type CanalOrigen, type OrigenCanalData } from "./Atencion";
/** @deprecated COPE no inventa estados propios. Usar Atencion.origen.ticketOriginalStatus */
export type { AtencionStatus } from "./AtencionStatus";
export { Cliente, type ClienteData } from "./Cliente";
export { Contexto, type ContextoData } from "./Contexto";
export { Diagnostico, type DiagnosticoData } from "./Diagnostico";
export { Hipotesis, type HipotesisData, type NivelConfianza } from "./Hipotesis";
export { Actividad, type ActividadData, type TipoActividad, type SubtipoActividad, type OrigenActividad, type ResultadoActividad } from "./Actividad";
export { Comunicacion, type ComunicacionData, type MensajeResumen } from "./Comunicacion";
export { ResultadoAtencion, type ResultadoAtencionData, type TipoResultadoAtencion } from "./Resultado";
