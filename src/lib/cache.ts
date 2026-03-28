/**
 * Simple in-memory cache with TTL support.
 * Used for hot paths like leaderboard data, level configs, etc.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// Singleton cache instance
export const cache = new MemoryCache();

// TTL constants
export const CACHE_TTL = {
  LEADERBOARD: 5 * 60 * 1000, // 5 minutes
  LEVEL_CONFIG: 30 * 60 * 1000, // 30 minutes
  DOMAIN_LIST: 10 * 60 * 1000, // 10 minutes
  DAILY_CHALLENGE: 60 * 60 * 1000, // 1 hour
  USER_XP: 60 * 1000, // 1 minute
} as const;
