/**
 * Lightweight SWR (stale-while-revalidate) client cache.
 *
 * Rules:
 *  - Module-level Map persists across component mounts within the same SPA session.
 *  - Hooks check cache first → if hit, return cached data instantly (no loading flash).
 *  - Then background-fetch and update state silently.
 *  - TTL controls when data is considered stale and a background refresh triggers.
 *  - No external dependencies — satisfies the "no Redux, no Zustand" constitution rule.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Default TTL: 2 minutes */
const DEFAULT_TTL_MS = 2 * 60 * 1000;

/** Get cached data if it exists (even if stale). Returns null if no cache entry. */
export function getCached<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    return entry ? entry.data : null;
}

/** Check if cached data is still fresh (within TTL). */
export function isFresh(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
    const entry = cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttlMs;
}

/** Write data to cache. */
export function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

/** Remove a specific cache entry. */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/** Clear all cache entries. */
export function clearCache(): void {
    cache.clear();
}
