export type CaseStatus =
  | "nuevo" | "en_analisis" | "diagnosticado" | "esperando_cliente"
  | "esperando_proveedor" | "implementando" | "validacion"
  | "resuelto" | "cerrado" | "reabierto";

export interface Case {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  dominio: string;
  assignedTo: string | null;
  watchers: string[];
  priority: "baja" | "media" | "alta" | "critica";
  tags: string[];
  ticketId: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface CaseHistory {
  id: string;
  caseId: string;
  action: string;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus | null;
  userId: string;
  comment: string;
  createdAt: string;
}

export interface CaseComment {
  id: string;
  caseId: string;
  content: string;
  author: string;
  internal: boolean;
  createdAt: string;
}

export interface CaseSLA {
  caseId: string;
  priority: string;
  limitHours: number;
  elapsedHours: number;
  breached: boolean;
  breachAt: string | null;
}

export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  nuevo: ["en_analisis"],
  en_analisis: ["diagnosticado", "esperando_cliente"],
  diagnosticado: ["esperando_cliente", "esperando_proveedor", "implementando"],
  esperando_cliente: ["en_analisis", "implementando"],
  esperando_proveedor: ["implementando"],
  implementando: ["validacion"],
  validacion: ["resuelto", "en_analisis"],
  resuelto: ["cerrado", "reabierto"],
  cerrado: ["reabierto"],
  reabierto: ["en_analisis"],
};
