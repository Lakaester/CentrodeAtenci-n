export interface AuditRecord {
  id: string;
  timestamp: string;
  usuario: string;
  dominio: string;
  accion: string;
  provider: string;
  payload: unknown;
  resultado: "exito" | "error";
  detalle?: string;
  durationMs: number;
}
