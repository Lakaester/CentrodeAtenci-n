export type TipoHerramienta = "pagina_web" | "dashboard" | "sistema_interno" | "api" | "plugin" | "aplicacion_externa" | "documento" | "notebooklm";
export type EstadoHerramienta = "activo" | "inactivo" | "mantenimiento";

export interface ParametroHerramienta {
  nombre: string;
  etiqueta: string;
  requerido: boolean;
}

export interface Herramienta {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  categoria: string;
  urlBase: string;
  parametros: ParametroHerramienta[];
  tipo: TipoHerramienta;
  estado: EstadoHerramienta;
  orden: number;
  visible: boolean;
  tiposAtencion: string[];
  responsable: string;
  createdAt: string;
  updatedAt: string;
}

export interface HerramientasPorTipo {
  tipoAtencion: string;
  herramientas: Herramienta[];
}
