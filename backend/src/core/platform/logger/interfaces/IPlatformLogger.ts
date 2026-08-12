import type { LogEntry, LogLevel } from "../types";

export interface IPlatformLogger {
  log(entry: LogEntry): void;
  info(message: string, meta?: Partial<LogEntry>): void;
  warn(message: string, meta?: Partial<LogEntry>): void;
  error(message: string, meta?: Partial<LogEntry>): void;
  debug(message: string, meta?: Partial<LogEntry>): void;
}
