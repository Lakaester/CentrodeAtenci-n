import type { IAuditService } from "../interfaces/IAuditService";
import type { AuditRecord } from "../types";

export class AuditService implements IAuditService {
  private store: AuditRecord[] = [];

  async record(record: Omit<AuditRecord, "id" | "timestamp">): Promise<void> {
    const entry: AuditRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.store.push(entry);
    console.log(`[AUDIT] ${entry.usuario} → ${entry.accion} en ${entry.dominio} [${entry.resultado}]`);
  }

  async findByDomain(dominio: string, limit = 50): Promise<AuditRecord[]> {
    return this.store
      .filter((r) => r.dominio === dominio)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }
}
