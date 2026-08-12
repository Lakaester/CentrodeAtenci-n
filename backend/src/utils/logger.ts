/**
 * Logger mínimo y centralizado. En FASE 6 se puede sustituir
 * por pino/winston sin tocar el resto del código.
 */
const ts = () => new Date().toISOString();

export const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[INFO ] ${ts()} ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[WARN ] ${ts()} ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${ts()} ${msg}`, ...args),
};
