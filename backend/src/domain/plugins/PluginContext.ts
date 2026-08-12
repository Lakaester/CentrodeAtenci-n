/** @deprecated Usar la implementación en src/core/ en su lugar. Este archivo se eliminará en M2. */
import type { PluginContextData } from "./PluginTypes";

export class PluginContext {
  readonly casoId?: string;
  readonly clienteId?: string;
  readonly canal?: string;
  readonly categoriaId?: string;
  readonly usuarioId?: string;
  readonly roles?: string[];
  readonly dominio?: string;
  readonly workspaceId?: string;

  constructor(data: PluginContextData) {
    this.casoId = data.casoId;
    this.clienteId = data.clienteId;
    this.canal = data.canal;
    this.categoriaId = data.categoriaId;
    this.usuarioId = data.usuarioId;
    this.roles = data.roles;
    this.dominio = data.dominio;
    this.workspaceId = data.workspaceId;
  }

  toJSON(): PluginContextData {
    return {
      casoId: this.casoId,
      clienteId: this.clienteId,
      canal: this.canal,
      categoriaId: this.categoriaId,
      usuarioId: this.usuarioId,
      roles: this.roles,
      dominio: this.dominio,
      workspaceId: this.workspaceId,
    };
  }
}

