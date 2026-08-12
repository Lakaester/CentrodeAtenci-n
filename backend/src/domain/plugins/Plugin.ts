/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import type { PluginCategoria, PluginEstado, PluginPermisos, PluginAccion, PluginContextData, PluginResultado } from "./PluginTypes";

export abstract class Plugin {
  abstract readonly id: string;
  abstract readonly nombre: string;
  abstract readonly categoria: PluginCategoria;
  abstract readonly icono: string;
  abstract readonly descripcion: string;
  abstract readonly permisos: PluginPermisos;

  private _estado: PluginEstado = "disponible";

  get estado(): PluginEstado {
    return this._estado;
  }

  set estado(nuevo: PluginEstado) {
    this._estado = nuevo;
  }

  abstract disponible(): Promise<boolean>;

  abstract abrir(contexto: PluginContextData): Promise<PluginResultado>;

  abstract obtenerContexto(contexto: PluginContextData): Promise<Record<string, unknown>>;

  abstract obtenerAcciones(): PluginAccion[];

  abstract ejecutar(accionId: string, contexto: PluginContextData, parametros?: Record<string, unknown>): Promise<PluginResultado>;
}

