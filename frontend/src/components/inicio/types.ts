export interface GeneralStatus {
  pendientes: number;
  enProceso: number;
  esperandoCliente: number;
  resueltosHoy: number;
  slaCumplimiento: number;
}

export interface ChannelData {
  pendientes: number;
  sla: number;
  mayorEspera: string;
  volumenDia: number;
  trend?: number;
}

export interface ChannelGroup {
  whatsapp: ChannelData;
  correo: ChannelData;
  consolidado: ChannelData;
}

export interface Alerta {
  id: string;
  tipo: "sla" | "volumen" | "sobrecarga" | "dev";
  mensaje: string;
  severidad: "alta" | "media" | "baja";
  timestamp?: string;
}

export interface Asesor {
  id: string;
  nombre: string;
  iniciales: string;
  estado: "Disponible" | "Ocupado" | "En pausa" | "Fuera de línea";
  atencionesActivas: number;
  sla: number;
  ultimaActividad: string;
}

export interface TrendRow {
  categoria: string;
  hoy: number;
  variacion: number;
}

export interface DevStatus {
  pendientes: number;
  enDesarrollo: number;
  qa: number;
  cerradosHoy: number;
}

export interface InicioData {
  general: GeneralStatus;
  canales: ChannelGroup;
  alertas: Alerta[];
  equipo: Asesor[];
  tendencias: TrendRow[];
  dev: DevStatus;
}
