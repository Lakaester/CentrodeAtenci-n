/** Tipos compartidos del frontend (mismo contrato de filtros que el backend). */
export interface DashboardFilters {
  fechaHoraInicio?: string;   // YYYY-MM-DD HH:mm
  fechaHoraFin?: string;      // YYYY-MM-DD HH:mm
  canal?: string[];
  subcanal?: string[];
  pais?: string[];
  asesor?: string[];
  categoria?: string[];
  subcategoria?: string[];
  dominio?: string[];
  estado?: string[];
  tipoCliente?: string[];
  rangoAtencion?: string[];
  rangoPrimeraRespuesta?: string[];
  search?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}
