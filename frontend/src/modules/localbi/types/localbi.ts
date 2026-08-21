export interface LocalbiKam {
  localbi_kam: string;
  localbi_kamid: string;
  link_dominio?: string;
}

export interface LocalbiResumenNps {
  locales_con_nps: number;
  promedio: number | null;
  promedio_producto: number | null;
}

export interface LocalbiResumen {
  activos: number;
  inactivos: number;
  churn: number;
  sin_implementar: number;
  total: number;
  aporte_mensual_total: number;
  nps: LocalbiResumenNps | null;
}

export interface LocalbiLocalNps {
  llamadabi_nps: string | null;
  llamadabi_npsproducto: string | null;
  llamadabi_npmsservicio: string | null;
  fecha: string | null;
}

export interface LocalbiTarea {
  tarea_id: string;
  ticket_id: string;
  titulo: string;
  estado: string;
  responsable: string;
  detalle: string;
  conclusion: string;
  sprint: string;
}

export interface LocalbiTicket {
  ticket_id: string;
  localbi_id: string;
  link_dominio: string;
  tipo: string;
  subcategoria: string;
  titulo: string;
  estado: string;
  fecha_creacion: string;
  fecha_limite_sla: string;
  fecha_solucion: string;
  area_responsable: string;
  observaciones: string;
  tareas: LocalbiTarea[];
}

export interface LocalbiLocal {
  localbi_id: string;
  nombre: string;
  link_dominio: string;
  ciudad: string;
  pais: string;
  direccion: string;
  estado: string;
  precio: number | null;
  plan: string;
  cantidadmodulosusa: number;
  porcentajemodulousa: number;
  nps: LocalbiLocalNps | null;
  tickets: LocalbiTicket[];
  tareas_sueltas: LocalbiTarea[];
}

export interface LocalbiDominio {
  dominio: string;
  locales: LocalbiLocal[];
}

export interface LocalbiHistoriaClinica {
  unidadnegocio_id: string;
  unidadnegocio_nombre: string;
  segmento: string;
  pago_mensual: number | null;
  plan: string;
  kam: LocalbiKam | null;
  resumen: LocalbiResumen;
  dominios: LocalbiDominio[];
}

export interface LocalbiUnidadNegocio {
  unidad_negocio: string;
  nombre: string;
  paises: string[];
  cs: {
    localbi_kam: string;
    localbi_kamid: string;
  };
  total_locales: number;
  activos: number;
  inactivos: number;
  churn: number;
  sin_implementar: number;
  pago_mensual: number | null;
  aporte_mensual_total: number | null;
  segmento: string;
}

export interface LocalbiBusquedaSalida {
  unidades: LocalbiUnidadNegocio[];
  totalRegistros: number;
  pagina: number;
  limite: number;
}

/** Actividad real de COPE (v_unificado_norm) enriquecida por dominio. */
export interface ActividadAgrupada {
  nombre: string;
  cantidad: number;
}

export interface ActividadResumen {
  total: number;
  canales: ActividadAgrupada[];
  categorias: ActividadAgrupada[];
  subcategorias: ActividadAgrupada[];
  asesores: ActividadAgrupada[];
  estados: ActividadAgrupada[];
  primera_atencion: string | null;
  ultima_atencion: string | null;
}

export interface AtencionActividad {
  localbi_id: string | null;
  dominio: string | null;
  canal: string | null;
  categoria: string | null;
  subcategoria: string | null;
  asesor: string | null;
  estado: string | null;
  fecha: string;
  contacto: string | null;
  numero: string | null;
}

export interface ActividadDominio {
  dominio: string;
  resumen: ActividadResumen;
  ultimasAtenciones: AtencionActividad[];
}

/** Soporte en Línea (public.incidencias). */
export interface Incidencia {
  id_incidencia: string;
  ticket_timestamp: string;
  descripcion: string | null;
  suscripcion: string | null;
  local_nombre: string | null;
  categorizacion: string | null;
  estado: string | null;
  solucion: string | null;
  asesor_nombre: string | null;
  tiempo_espera_minutos: number | null;
  tiempo_solucion_minutos: number | null;
  incidenciacliente_localpais: string | null;
  tipoproblema: string | null;
  subtipoproblema: string | null;
  incidenciacliente_kam: string | null;
}

export interface SoporteResumen {
  total: number;
  abiertas: number;
  cerradas: number;
  primera_incidencia: string | null;
  ultima_incidencia: string | null;
  prom_espera_min: number | null;
  prom_solucion_min: number | null;
  categorias: ActividadAgrupada[];
  estados: ActividadAgrupada[];
  porLocal: ActividadAgrupada[];
}

export interface SoporteOnlineDominio {
  dominio: string;
  resumen: SoporteResumen;
  ultimasIncidencias: Incidencia[];
}

export interface SoporteOnlineResult {
  porDominio: SoporteOnlineDominio[];
  nombreLocalPorDominio: Record<string, string>;
  totalIncidencias: number;
}

/** Historia Clínica de un LOCAL específico. */
export interface HistoriaLocal {
  localbi_id: string;
  dominio: string | null;
  local: LocalbiLocal | null;
  actividadLocal: { resumen: ActividadResumen; detalle: AtencionActividad[] };
  actividadDominio: { resumen: ActividadResumen; detalle: AtencionActividad[] } | null;
  soporte: { resumen: SoporteResumen; ultimasIncidencias: Incidencia[] } | null;
  tickets: LocalbiTicket[];
  tareasSueltas: LocalbiTarea[];
  nps: LocalbiLocalNps | null;
  disponible: {
    actividadLocal: boolean;
    actividadDominio: boolean;
    soporte: boolean;
    tickets: boolean;
  };
}
