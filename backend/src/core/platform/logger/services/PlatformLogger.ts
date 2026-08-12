import type { IPlatformLogger } from "../interfaces/IPlatformLogger";
import type { LogEntry, LogLevel } from "../types";

export class PlatformLogger implements IPlatformLogger {
  private buildEntry(level: LogLevel, message: string, meta?: Partial<LogEntry>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      requestId: meta?.requestId ?? crypto.randomUUID(),
      level,
      message,
      ...meta,
    };
  }

  log(entry: LogEntry): void {
    const line = `[${entry.level}] ${entry.timestamp} ${entry.action ?? ""} ${entry.message}`;
    if (entry.level === "ERROR") console.error(line);
    else if (entry.level === "WARN") console.warn(line);
    else console.log(line);
  }

  info(message: string, meta?: Partial<LogEntry>): void {
    this.log(this.buildEntry("INFO", message, meta));
  }

  warn(message: string, meta?: Partial<LogEntry>): void {
    this.log(this.buildEntry("WARN", message, meta));
  }

  error(message: string, meta?: Partial<LogEntry>): void {
    this.log(this.buildEntry("ERROR", message, meta));
  }

  debug(message: string, meta?: Partial<LogEntry>): void {
    this.log(this.buildEntry("DEBUG", message, meta));
  }
}
