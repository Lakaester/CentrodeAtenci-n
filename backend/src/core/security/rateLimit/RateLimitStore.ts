/**
 * Abstracción de store para rate limiting (política O3-B.5).
 * Single-instance: implementación en memoria, sin Redis.
 */
export interface RateLimitStore {
  /** Registra un fallo de autenticación para la clave en el instante dado. */
  record(key: string, at: number): void;
  /** Cuenta los registros de la clave dentro de la ventana [at - windowMs, at]. */
  count(key: string, at: number, windowMs: number): number;
  /** Devuelve hasta qué instante la clave está temporalmente bloqueada (0 = no bloqueada). */
  getBlockedUntil(key: string): number;
  /** Fija el bloqueo temporal de la clave. */
  setBlockedUntil(key: string, until: number): void;
  /** Elimina registros y bloqueos anteriores a `before`. */
  prune(before: number): void;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly records = new Map<string, number[]>();
  private readonly blockedUntil = new Map<string, number>();
  private readonly retentionMs: number;

  constructor(retentionMs = 60 * 60 * 1000) {
    this.retentionMs = retentionMs;
  }

  record(key: string, at: number): void {
    const cutoff = at - this.retentionMs;
    const prev = this.records.get(key)?.filter((t) => t > cutoff) ?? [];
    prev.push(at);
    this.records.set(key, prev);
  }

  count(key: string, at: number, windowMs: number): number {
    const list = this.records.get(key);
    if (!list) return 0;
    const cutoff = at - this.retentionMs;
    const active = list.filter((t) => t > cutoff);
    if (active.length === 0) {
      this.records.delete(key);
      return 0;
    }
    if (active.length !== list.length) this.records.set(key, active);
    const from = at - windowMs;
    let n = 0;
    for (const t of active) if (t >= from) n++;
    return n;
  }

  getBlockedUntil(key: string): number {
    return this.blockedUntil.get(key) ?? 0;
  }

  setBlockedUntil(key: string, until: number): void {
    this.blockedUntil.set(key, until);
  }

  prune(before: number): void {
    for (const [key, list] of this.records) {
      const filtered = list.filter((t) => t > before);
      if (filtered.length === 0) this.records.delete(key);
      else this.records.set(key, filtered);
    }
    for (const [key, until] of this.blockedUntil) {
      if (until <= before) this.blockedUntil.delete(key);
    }
  }
}