export interface Action {
  id: string;
  nombre: string;
  descripcion: string;
  execute: (params: unknown) => Promise<void>;
}

export class ActionRegistry {
  private actions = new Map<string, Action>();

  register(action: Action): void {
    this.actions.set(action.id, action);
    console.log(`[ActionRegistry] Registrada: ${action.id}`);
  }

  get(id: string): Action | undefined {
    return this.actions.get(id);
  }

  list(): Action[] {
    return Array.from(this.actions.values());
  }
}
