import type { WorkflowDefinition } from "../types";

export class WorkflowRegistry {
  private defs = new Map<string, WorkflowDefinition>();

  register(def: WorkflowDefinition): void {
    this.defs.set(def.id, def);
  }

  get(id: string): WorkflowDefinition | undefined {
    return this.defs.get(id);
  }

  list(): WorkflowDefinition[] {
    return Array.from(this.defs.values());
  }

  findActive(): WorkflowDefinition[] {
    return this.list().filter((d) => d.status === "active");
  }

  search(query: string): WorkflowDefinition[] {
    const q = query.toLowerCase();
    return this.list().filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }

  count(): number {
    return this.defs.size;
  }
}
