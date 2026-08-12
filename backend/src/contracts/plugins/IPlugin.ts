import type { PluginCategoria, PluginEstado, PluginPermisos, PluginAccion, PluginContextData, PluginResultado } from "../../domain/plugins/PluginTypes";

export interface IPlugin {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: PluginCategoria;
  readonly icono: string;
  readonly descripcion: string;
  readonly permisos: PluginPermisos;
  readonly estado: PluginEstado;

  disponible(): Promise<boolean>;
  abrir(contexto: PluginContextData): Promise<PluginResultado>;
  obtenerContexto(contexto: PluginContextData): Promise<Record<string, unknown>>;
  obtenerAcciones(): PluginAccion[];
  ejecutar(accionId: string, contexto: PluginContextData, parametros?: Record<string, unknown>): Promise<PluginResultado>;
}
