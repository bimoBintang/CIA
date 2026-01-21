// Simple cache utility for API data
const CACHE_DURATION = 60000; // 1 minute

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key?: string): void {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}

export async function fetchWithCache<T>(
    url: string,
    options?: { force?: boolean }
): Promise<{ data: T | null; fromCache: boolean }> {
    const cached = getCached<T>(url);

    if (cached && !options?.force) {
        return { data: cached, fromCache: true };
    }

    try {
        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
            setCache(url, json.data);
            return { data: json.data, fromCache: false };
        }

        return { data: null, fromCache: false };
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return { data: null, fromCache: false };
    }
}
