// ── Apoyos ──

export type ApoyoEstado = "PENDIENTE" | "ACTIVO" | "CERRADO";

export type ApoyoCategoria =
  | "Dudas y consultas"
  | "Apoyos con clientes"
  | "Manejo de casos derivado"
  | "Apoyo funciones de otras áreas";

export interface Apoyo {
  id: string;
  ticket: string;
  asesor_id: string;
  asesor_nombre: string;
  dominio: string | null;
  cliente_nombre: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  duracion_min: number | null;
  estado: ApoyoEstado;
  categoria: ApoyoCategoria;
  subcategoria_fun: string | null;
  sub_subcategoria_fun: string | null;
  area: string;
  persona_apoyo: string | null;
  comentario: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  cerrado_at: string | null;
  cerrado_by: string | null;
}

export interface ApoyoKpis {
  total: number;
  pendientes: number;
  activos: number;
  cerrados: number;
}

export interface CrearApoyoInput {
  asesorId: string;
  asesorNombre: string;
  dominio?: string | null;
  clienteNombre?: string | null;
  fecha: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  categoria: ApoyoCategoria;
  subcategoriaFun?: string | null;
  subSubcategoriaFun?: string | null;
  area: string;
  personaApoyo?: string | null;
  comentario?: string | null;
}

export type ActualizarApoyoInput = Partial<Omit<CrearApoyoInput, "asesorId" | "asesorNombre">>;

// ── Agendas ──

export type AgendaTipo = "REUNION" | "CAPACITACION";
export type AgendaEstado = "PENDIENTE" | "ACTIVA" | "FINALIZADA" | "CANCELADA";
export type AgendaResultado = "REALIZADA" | "SIN_REALIZAR" | "CANCELADA";

export interface ActaParticipante {
  nombre: string;
  empresa: string;
  cargo: string;
  participacion: string;
}

export interface ActaAcuerdo {
  id: string;
  descripcion: string;
  responsable: "Restaurant.pe" | "Cliente";
  fecha_limite: string;
  estado: "Pendiente" | "En proceso" | "Completado";
}

export interface ActaEvidencia {
  id: string;
  nombre: string;
  tamano: number;
  tipo: string;
}

export interface ActaContenido {
  participantes: ActaParticipante[];
  tipo_caso: string;
  motivo: string;
  desarrollo: string;
  diagnostico: string;
  gestion: string;
  solucion: string;
  acuerdos: ActaAcuerdo[];
  resultado_acta: string;
  requiere_seguimiento: boolean;
  seguimiento_fecha: string;
  seguimiento_detalle: string;
  observaciones: string;
  evidencias: ActaEvidencia[];
}

export interface Agenda {
  id: string;
  ticket: string;
  tipo: AgendaTipo;
  asesor_id: string;
  asesor_nombre: string;
  asesor_correo: string;
  dominio: string | null;
  cliente_nombre: string | null;
  cliente_numero: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_min: number | null;
  estado: AgendaEstado;
  descripcion: string | null;
  hora_inicio_real: string | null;
  hora_fin_real: string | null;
  duracion_real_min: number | null;
  resultado: AgendaResultado | null;
  calendar_event_id: string | null;
  calendar_html_link: string | null;
  calendar_sync_status: string | null;
  calendar_sync_error: string | null;
  calendar_meet_link: string | null;
  acta_file_id: string | null;
  acta_nombre: string | null;
  acta_tipo: string | null;
  acta_tamano: number | null;
  acta_contenido: ActaContenido | null;
  acta_estado: "BORRADOR" | "FINALIZADA" | null;
  grabacion_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AgendaKpis {
  total: number;
  pendientes: number;
  activas: number;
  finalizadas: number;
  canceladas: number;
}

export interface CrearAgendaInput {
  tipo: AgendaTipo;
  asesorId: string;
  asesorNombre: string;
  asesorCorreo: string;
  dominio?: string | null;
  clienteNombre?: string | null;
  clienteNumero?: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado?: AgendaEstado;
  descripcion?: string | null;
  grabacionUrl?: string | null;
}

export type ActualizarAgendaInput = Partial<Omit<CrearAgendaInput, "asesorId" | "asesorNombre" | "asesorCorreo">>;

// ── Asesores ──

export interface AsesorInfo {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  iniciales: string | null;
}

// ── Catálogos ──

export interface CatalogoItem {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}
