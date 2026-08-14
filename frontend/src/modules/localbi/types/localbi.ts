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
