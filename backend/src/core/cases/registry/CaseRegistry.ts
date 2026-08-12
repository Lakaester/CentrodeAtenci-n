import type { Case } from "../types";

export class CaseRegistry {
  private cases = new Map<string, Case>();

  register(c: Case): void {
    this.cases.set(c.id, c);
  }

  get(id: string): Case | undefined {
    return this.cases.get(id);
  }

  list(): Case[] {
    return Array.from(this.cases.values());
  }

  findByStatus(status: string): Case[] {
    return this.list().filter((c) => c.status === status);
  }

  findByDomain(dominio: string): Case[] {
    return this.list().filter((c) => c.dominio === dominio);
  }

  findByAssignee(userId: string): Case[] {
    return this.list().filter((c) => c.assignedTo === userId);
  }

  search(query: string): Case[] {
    const q = query.toLowerCase();
    return this.list().filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }

  count(): number {
    return this.cases.size;
  }
}
