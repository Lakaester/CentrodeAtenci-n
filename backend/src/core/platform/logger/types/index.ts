export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  usuario?: string;
  dominio?: string;
  provider?: string;
  orchestrator?: string;
  action?: string;
  durationMs?: number;
  result?: string;
  message: string;
}
