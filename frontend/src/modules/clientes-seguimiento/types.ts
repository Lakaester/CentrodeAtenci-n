export type SeguimientoEstado = "sin_seguimiento" | "con_pendientes" | "finalizado";
export type SeguimientoScope = "semana" | "mes" | "backlog" | "todos";

export interface SeguimientoCandidato {
  clave: string;
  cliente: string;
  total: number;
  totalAnterior: number;
  variacionPct: number | null;
  reincidenciaMax: number;
  subcategoriaRecurrente: string | null;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
  motivos: string[];
  senales: number;
  yaEnSeguimiento: boolean;
  casoId: string | null;
  estadoCaso: SeguimientoEstado | null;
}

export interface SeguimientoLote {
  id: string;
  periodo: string;
  semanaIso: string;
  desde: string;
  hasta: string;
  generadoPor: string | null;
  totalCandidatos: number;
  totalCasos: number;
  createdAt: string;
}

export interface SeguimientoAsesor {
  id: string;
  nombre: string;
  rol: string | null;
}

export interface SeguimientoCaso {
  id: string;
  claveCliente: string;
  cliente: string;
  estado: SeguimientoEstado;
  asesorId: string | null;
  asesorNombre: string | null;
  total: number;
  totalAnterior: number;
  variacionPct: number | null;
  reincidenciaMax: number;
  subcategoriaRecurrente: string | null;
  tiempoPromedio: number | null;
  conDato: number;
  noCumple: number;
  pctIncumple: number | null;
  motivos: string[];
  senales: number;
  semanaDeteccion: string;
  periodoDeteccion: string;
  primeraDeteccionAt: string;
  ultimaDeteccionAt: string;
  contactoAt: string | null;
  proximoContactoAt: string | null;
  resumenContacto: string | null;
  finalizadoAt: string | null;
  finalizadoPor: string | null;
  enBacklog: boolean;
  diasSinContacto: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeguimientoGestion {
  id: string;
  casoId: string;
  contactoAt: string;
  proximoContactoAt: string | null;
  resumen: string;
  estadoAnterior: SeguimientoEstado | null;
  estadoNuevo: SeguimientoEstado;
  usuarioId: string | null;
  usuario: string | null;
  createdAt: string;
}

export interface SeguimientoAtencion {
  ticket: string;
  canal: string;
  fecha: string;
  categoria: string;
  subcategoria: string;
  asesor: string;
  estado: string;
  tiempo: number | null;
  cumpleSla: boolean | null;
  umbral: number;
  urlTicket: string | null;
}

export interface SeguimientoLista {
  total: number;
  page: number;
  pageSize: number;
  rows: SeguimientoCaso[];
}

export interface SeguimientoAtencionesLista {
  total: number;
  page: number;
  pageSize: number;
  rows: SeguimientoAtencion[];
}

export interface SeguimientoResumen {
  semanaActual: string;
  periodoActual: string;
  kpis: {
    porContactar: number;
    conPendientes: number;
    finalizados: number;
    backlog: number;
    backlogSinContacto: number;
    backlogVencidos: number;
    totalSemana: number;
    totalMes: number;
  };
  porSenal: { senal: string; total: number }[];
  backlogPorPeriodo: { periodo: string; total: number }[];
  lotes: SeguimientoLote[];
  asesores: SeguimientoAsesor[];
}

export interface SeguimientoDetalle extends SeguimientoCaso {
  gestiones: SeguimientoGestion[];
}

export interface SeguimientoCrearLoteResult {
  lote: SeguimientoLote;
  creados: number;
  actualizados: number;
  omitidos: number;
  candidatos: number;
}

export interface SeguimientoCandidatosResponse {
  desde: string;
  hasta: string;
  total: number;
  rows: SeguimientoCandidato[];
}

export interface SeguimientoFiltrosLista {
  scope?: SeguimientoScope;
  periodo?: string;
  semana?: string;
  estado?: SeguimientoEstado;
  asesorId?: string;
  senal?: string;
  search?: string;
  soloMisCasos?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SeguimientoGestionInput {
  contactoAt: string;
  proximoContactoAt?: string | null;
  resumen: string;
  estadoNuevo: SeguimientoEstado;
}
