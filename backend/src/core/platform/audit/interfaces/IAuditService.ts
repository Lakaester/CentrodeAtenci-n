import type { AuditRecord } from "../types";

export interface IAuditService {
  record(record: Omit<AuditRecord, "id" | "timestamp">): Promise<void>;
  findByDomain(dominio: string, limit?: number): Promise<AuditRecord[]>;
}
