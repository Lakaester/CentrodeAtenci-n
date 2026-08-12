import { Workspace } from "./Workspace";
import { WorkspaceContext, type WorkspaceContextData } from "./WorkspaceContext";
import { WorkspaceFactory } from "./WorkspaceFactory";

export interface ConstruirWorkspaceParams {
  categoriaId: string;
  /** @deprecated Usar atencionId */
  casoId?: string;
  atencionId?: string;
  clienteId?: string;
  usuarioId?: string;
  roles?: string[];
  contextoAdicional?: Partial<WorkspaceContextData>;
}

export class WorkspaceEngine {
  private factory: typeof WorkspaceFactory;

  constructor() {
    this.factory = WorkspaceFactory;
  }

  inicializar(): void {
    this.factory.registrarFacturacion();
    this.factory.registrarLogistica();
    this.factory.registrarIntegraciones();
  }

  construir(params: ConstruirWorkspaceParams): Workspace {
    const contexto = new WorkspaceContext({
      ...params.contextoAdicional,
      permisos: params.roles,
    });

    const categoriaId = params.categoriaId;
    return this.factory.crear(categoriaId, contexto);
  }

  construirConContexto(contexto: WorkspaceContext): Workspace {
    const categoriaId = contexto.obtenerCategoriaId() ?? "default";
    return this.factory.crear(categoriaId, contexto);
  }

  recargar(contexto: WorkspaceContext): Workspace {
    return this.construirConContexto(contexto);
  }
}
