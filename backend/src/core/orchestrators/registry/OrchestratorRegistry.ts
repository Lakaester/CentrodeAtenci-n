import type { IOrchestrator } from "../interfaces/IOrchestrator";

export class OrchestratorRegistry {
  private items = new Map<string, IOrchestrator>();

  register(orchestrator: IOrchestrator): void {
    this.items.set(orchestrator.getName(), orchestrator);
    console.log(`[OrchestratorRegistry] Registrado: ${orchestrator.getName()}`);
  }

  get(name: string): IOrchestrator | undefined {
    return this.items.get(name);
  }

  list(): IOrchestrator[] {
    return Array.from(this.items.values());
  }

  find(problem: string): IOrchestrator[] {
    return this.list().filter((o) => o.canHandle({} as any, problem));
  }
}
