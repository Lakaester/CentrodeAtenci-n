export type CanalTicket = "whatsapp" | "meta" | "correo";
export type CanalOrigen = "zendesk" | "wameta" | "whaticket";
export type EstadoTicket =
  | "sin_atender"
  | "en_proceso"
  | "pendiente_cliente"
  | "esperando_desarrollo"
  | "esperando_gestion"
  | "resuelto";

export interface OrigenCanal {
  canal: CanalOrigen;
  ticketOriginalId: string;
  ticketOriginalStatus: string;
}
export type TipoCliente = "high_touch" | "low_touch" | "tech_touch";
export type IndicadorSLA = "verde" | "amarillo" | "rojo";
export type TipoMensaje = "cliente" | "agente" | "sistema";
export type EstadoCliente = "activo" | "suspendido" | "baja";
export type ResultadoAtencion = "responder" | "gestionar" | "dev";

export interface Ticket {
  id: string;
  canal: CanalTicket;
  iniciales: string;
  nombreCliente: string;
  dominio: string;
  pais: string;
  tipoCliente: TipoCliente;
  tiempoEsperando: string;
  tiempoAtencion: string;
  estado: EstadoTicket;
  categoria: string;
  subcategoria: string;
  sla: IndicadorSLA;
  prioridad: number;
  asunto: string;
  ultimoMensaje: string;
  timestamp: string;
  noLeido: number;
  agenteAsignado: string;
}

export type EventoSistemaTipo = "herramienta" | "dev" | "nota" | "automatico";

export interface EventoSistema {
  id: string;
  tipo: EventoSistemaTipo;
  icono: string;
  titulo: string;
  descripcion: string;
  timestamp: string;
}

export interface Mensaje {
  id: string;
  tipo: TipoMensaje;
  emisor: string;
  contenido: string;
  timestamp: string;
}

export interface AtencionHistorial {
  canal: string;
  fecha: string;
  asesor: string;
  categoria: string;
  subcategoria: string;
  tiempoRespuesta: string;
  tiempoResolucion: string;
  resultado: ResultadoAtencion;
}

export interface TicketDEV {
  id: string;
  titulo: string;
  estado: string;
  prioridad: string;
  fechaCreacion: string;
  responsable: string;
  tiempoAbierto: string;
}

export interface IntegracionEstado {
  nombre: string;
  estado: "conectado" | "desconectado" | "error";
  ultimaSync: string;
}

export interface LogisticaEstado {
  sincronizacion: string;
  colas: number;
  errores: number;
}

export interface ClienteInfo {
  /* General */
  nombre: string;
  iniciales: string;
  dominio: string;
  telefono: string;
  correo: string;
  pais: string;
  ruc: string;
  tipoCliente: TipoCliente;
  fechaAlta: string;
  tiempoCliente: string;
  ltv: string;
  estado: EstadoCliente;

  /* Producto */
  productoPrincipal: string;
  version: string;
  ultimaSincronizacion: string;
  configuracionesActivas: string[];
  cantidadLocales: number;
  facturacionElectronica: boolean;
  estadoCDT: string;
  fechaVencimientoCDT: string;
  estadoCertificado: string;
  foliosDisponibles: number;
  foliosConsumidos: number;
  foliosPendientes: number;

  /* Historial */
  ultimasAtenciones: AtencionHistorial[];
  categoriasFrecuentes: string[];
  subcategoriasFrecuentes: string[];
  asesorQueMasAtendio: string;
  promedioResolucion: string;
  promedioPrimeraRespuesta: string;

  /* Diagnóstico */
  estadoFE: string;
  documentosCola: number;
  erroresFE: string[];
  integraciones: IntegracionEstado[];
  logistica: LogisticaEstado;
  configuracionesCriticas: string[];

  /* Developer */
  ticketsDEV: TicketDEV[];

  /* Diagnóstico Inteligente */
  diagnostico: DiagnosticoData;

  /* Notas */
  notasInternas: string;
  observaciones: string;
  clientesVIP: string;
  recordatorios: string;
  notasAdministrativas: string;
}

/** @deprecated Usar Atencion.status */
export type EstadoCasoStep =
  | "ticket_recibido" | "aceptado" | "diagnostico_iniciado" | "informacion_solicitada"
  | "cliente_respondio" | "diagnostico_finalizado" | "escalado" | "ticket_dev_creado"
  | "gestion_iniciada" | "esperando_cliente" | "esperando_desarrollo" | "esperando_tercero"
  | "solucionado" | "confirmado_cliente" | "categorizado" | "cerrado";

/** @deprecated Usar Atencion.resultado.tipo */
export type ResultadoFinalCaso = "resuelto" | "parcial" | "escalado" | "pendiente" | "sin_respuesta" | "duplicado";

/** @deprecated Usar Atencion.timeline */
export interface CasoStep {
  id: string;
  estado: EstadoCasoStep;
  fecha: string;
  hora: string;
  usuario: string;
  comentario: string;
}

/** @deprecated */
export interface EvidenciaCaso {
  tipo: "adjunto" | "captura" | "video" | "log" | "enlace";
  nombre: string;
}

/** @deprecated Usar Atencion */
export interface CasoData {
  objetivo: string;
  resumenEjecutivo: string;
  proximoPaso: string;
  checklist: { label: string; checked: boolean }[];
  timeline: CasoStep[];
  evidencias: EvidenciaCaso[];
  herramientas: string[];
  resultado: ResultadoFinalCaso;
  lecciones: string[];
}

/** @deprecated */
export interface CasoSimilar {
  cliente: string;
  fecha: string;
  categoria: string;
  resultado: string;
}

/** @deprecated Usar Atencion.diagnostico */
export interface DiagnosticoData {
  categoriaSugerida: string;
  confianza: number;
  subcategoriaSugerida: string;
  checklist: { label: string; checked: boolean }[];
  posiblesCausas: string[];
  casosSimilares: CasoSimilar[];
  recomendaciones: string[];
  riesgos: { texto: string; tipo: "alta" | "media" | "baja" }[];
  tiempoEstimado: string;
}

export interface Indicadores {
  ticketsAbiertos: number;
  enProceso: number;
  pendientes: number;
  fueraSLA: number;
  promedioEspera: string;
  promedioAtencion: string;
}

export const ESTADO_LABELS: Record<EstadoTicket, string> = {
  sin_atender: "Sin atender",
  en_proceso: "En proceso",
  pendiente_cliente: "Pendiente cliente",
  esperando_desarrollo: "Esperando desarrollo",
  esperando_gestion: "Esperando gestión",
  resuelto: "Resuelto",
};

export const TIPO_CLIENTE_LABELS: Record<TipoCliente, string> = {
  high_touch: "High Touch",
  low_touch: "Low Touch",
  tech_touch: "Tech Touch",
};

export const ESTADO_CLIENTE_LABELS: Record<EstadoCliente, string> = {
  activo: "Activo",
  suspendido: "Suspendido",
  baja: "Baja",
};
