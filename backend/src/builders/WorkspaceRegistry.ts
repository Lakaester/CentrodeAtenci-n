import type { IWorkspaceBuilder } from "./WorkspaceDefinition";

export class WorkspaceRegistry {
  private static builders: Map<string, IWorkspaceBuilder> = new Map();

  static registrar(builder: IWorkspaceBuilder): void {
    if (WorkspaceRegistry.builders.has(builder.tipo)) return;
    WorkspaceRegistry.builders.set(builder.tipo, builder);
  }

  static obtener(tipo: string): IWorkspaceBuilder | undefined {
    return WorkspaceRegistry.builders.get(tipo);
  }

  static listarTipos(): string[] {
    return Array.from(WorkspaceRegistry.builders.keys());
  }
}
