import type { Workspace } from "../../domain/workspace/Workspace";
import type { WorkspaceContext } from "../../domain/workspace/WorkspaceContext";

export interface IWorkspaceProvider {
  obtenerWorkspace(categoriaId: string, contexto: WorkspaceContext): Promise<Workspace>;
  obtenerWorkspacePorCaso(casoId: string): Promise<Workspace>;
  actualizarWorkspace(workspaceId: string, contexto: WorkspaceContext): Promise<Workspace>;
}
