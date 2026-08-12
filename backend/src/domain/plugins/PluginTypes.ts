/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
export type PluginCategoria =
  | "facturacion"
  | "logistica"
  | "integraciones"
  | "desarrollo"
  | "documentacion"
  | "monitoreo"
  | "configuracion"
  | "general";

export type PluginEstado = "disponible" | "no_disponible" | "error" | "cargando";

export interface PluginPermisos {
  requiereAutenticacion: boolean;
  rolesPermitidos: string[];
  alcance: "global" | "por_caso" | "por_cliente";
}

export interface PluginAccion {
  id: string;
  nombre: string;
  descripcion: string;
  icono?: string;
}

export interface PluginContextData {
  casoId?: string;
  clienteId?: string;
  canal?: string;
  categoriaId?: string;
  usuarioId?: string;
  roles?: string[];
  dominio?: string;
  workspaceId?: string;
}

export interface PluginResultado {
  exito: boolean;
  datos?: unknown;
  error?: string;
  duracionMs?: number;
}

