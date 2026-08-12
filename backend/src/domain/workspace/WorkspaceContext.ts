import type { AtencionData } from "../atencion/Atencion";
import type { Cliente } from "../clientes/types";
import type { Canal } from "../canales/types";
import type { Categoria } from "../categorias/types";
import type { Subcategoria } from "../subcategoria/types";
import type { Usuario } from "../usuarios/types";

export interface WorkspacePlugin {
  id: string;
  nombre: string;
  icono: string;
  disponible: boolean;
}

export interface WorkspaceContextData {
  atencion?: AtencionData;
  cliente?: Cliente;
  canal?: Canal;
  categoria?: Categoria;
  subcategoria?: Subcategoria;
  asesor?: Usuario;
  slaPorcentaje?: number;
  permisos?: string[];
  pluginsDisponibles?: WorkspacePlugin[];
}

export class WorkspaceContext {
  readonly atencion?: AtencionData;
  readonly cliente?: Cliente;
  readonly canal?: Canal;
  readonly categoria?: Categoria;
  readonly subcategoria?: Subcategoria;
  readonly asesor?: Usuario;
  readonly slaPorcentaje?: number;
  readonly permisos?: string[];
  readonly pluginsDisponibles?: WorkspacePlugin[];

  constructor(data: WorkspaceContextData) {
    this.atencion = data.atencion;
    this.cliente = data.cliente;
    this.canal = data.canal;
    this.categoria = data.categoria;
    this.subcategoria = data.subcategoria;
    this.asesor = data.asesor;
    this.slaPorcentaje = data.slaPorcentaje;
    this.permisos = data.permisos;
    this.pluginsDisponibles = data.pluginsDisponibles;
  }

  obtenerCategoriaId(): string | undefined {
    return this.categoria?.id ?? this.atencion?.contexto.categoria;
  }

  toJSON(): WorkspaceContextData {
    return {
      atencion: this.atencion,
      cliente: this.cliente,
      canal: this.canal,
      categoria: this.categoria,
      subcategoria: this.subcategoria,
      asesor: this.asesor,
      slaPorcentaje: this.slaPorcentaje,
      permisos: this.permisos,
      pluginsDisponibles: this.pluginsDisponibles,
    };
  }
}
