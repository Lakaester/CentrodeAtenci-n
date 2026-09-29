/**
 * Abstracción de store para rate limiting (política O3-B.5 + correcciones H-01..H-04).
 * Single-instance: implementación en memoria, sin Redis.
 *
 * Semántica:
 * - failure counter: marcas de tiempo por key (sliding window).
 * - strike/backoff state: nivel de bloqueo progresivo por key (H-02).
 * - blockedUntil: bloqueo temporal vigente por key.
 * - clear(): resetea cuenta/estado (éxito de login, H-04).
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
  /** Nivel de strike actual (0 = sin episodio de bloqueo). */
  getStrikes(key: string): number;
  /** Reinicia el nivel de strike de la clave. */
  resetStrikes(key: string): void;
  /** Avanza el nivel de strike (máx `max`) y devuelve el nuevo nivel. */
  nextStrike(key: string, max: number): number;
  /** Elimina registros, strikes y bloqueo de la clave (reset por éxito). */
  clear(key: string): void;
  /**
   * Milisegundos restantes hasta que el conteo de la clave en [at - windowMs, at]
   * baje del límite (0 si ya está bajo el límite).
   */
  timeUntilBelow(key: string, at: number, windowMs: number, limit: number): number;
  /** Elimina registros, strikes y bloqueos anteriores a `before`. */
  prune(before: number): void;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly records = new Map<string, number[]>();
  private readonly blockedUntil = new Map<string, number>();
  private readonly strikes = new Map<string, number>();
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

  getStrikes(key: string): number {
    return this.strikes.get(key) ?? 0;
  }

  resetStrikes(key: string): void {
    this.strikes.delete(key);
  }

  nextStrike(key: string, max: number): number {
    const current = this.strikes.get(key) ?? 0;
    const next = Math.min(current + 1, max);
    this.strikes.set(key, next);
    return next;
  }

  clear(key: string): void {
    this.records.delete(key);
    this.strikes.delete(key);
    this.blockedUntil.delete(key);
  }

  timeUntilBelow(key: string, at: number, windowMs: number, limit: number): number {
    const list = this.records.get(key);
    if (!list) return 0;
    const from = at - windowMs;
    const within = list.filter((t) => t >= from).sort((a, b) => a - b);
    if (within.length < limit) return 0;
    const idx = within.length - limit;
    const slide = within[idx];
    const remaining = slide + windowMs - at;
    return remaining > 0 ? remaining : 0;
  }

  prune(before: number): void {
    for (const [key, list] of this.records) {
      const filtered = list.filter((t) => t > before);
      if (filtered.length === 0) {
        this.records.delete(key);
        this.strikes.delete(key);
        this.blockedUntil.delete(key);
      } else {
        this.records.set(key, filtered);
      }
    }
    for (const [key, until] of this.blockedUntil) {
      if (until <= before) this.blockedUntil.delete(key);
    }
    for (const key of this.strikes.keys()) {
      if (!this.records.has(key)) this.strikes.delete(key);
    }
  }
}