import type { ICacheService } from "../interfaces/ICacheService";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class MemoryCache implements ICacheService {
  private store = new Map<string, CacheEntry>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutos

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtl),
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
