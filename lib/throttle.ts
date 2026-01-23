import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis (falls back to in-memory if not configured)
let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (redis) return redis;

    // Try Vercel KV naming first (most common)
    const url = process.env.KV_REST_API_URL!;
    const token = process.env.KV_REST_API_TOKEN!;

    if (url && token) {
        redis = new Redis({ url, token });
        return redis;
    }

    return null;
}

// Throttle violation tracking for progressive penalty
interface ViolationEntry {
    count: number;
    lastViolation: number;
    penaltyUntil: number;
}

const violationStore = new Map<string, ViolationEntry>();

// Cleanup old violations every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of violationStore.entries()) {
        // Remove entries older than 24 hours
        if (now - entry.lastViolation > 24 * 60 * 60 * 1000) {
            violationStore.delete(key);
        }
    }
}, 10 * 60 * 1000);

// Rate limit configurations per endpoint
export interface ThrottleConfig {
    requests: number;      // Max requests
    window: string;        // Time window (e.g., '1m', '5m', '1h')
    penalty: 'none' | 'block' | 'progressive';
    baseTimeoutMs?: number;  // For progressive penalty
    factor?: number;         // Multiplier for progressive penalty
}

export const THROTTLE_CONFIGS: Record<string, ThrottleConfig> = {
    // Strict for login - progressive penalty
    login: {
        requests: 5,
        window: '5m',
        penalty: 'progressive',
        baseTimeoutMs: 60000,      // 1 minute base
        factor: 2,                  // Double each time
    },
    // OTP verification
    otp: {
        requests: 3,
        window: '5m',
        penalty: 'progressive',
        baseTimeoutMs: 120000,     // 2 minutes base
        factor: 3,
    },
    // File uploads
    upload: {
        requests: 10,
        window: '1h',
        penalty: 'block',
    },
    // Read-only API (GET requests) - more lenient
    read: {
        requests: 200,
        window: '1m',
        penalty: 'block',
    },
    // Write API (POST/PUT/DELETE) - stricter
    write: {
        requests: 50,
        window: '1m',
        penalty: 'block',
    },
    // General API (legacy, use read/write instead)
    api: {
        requests: 100,
        window: '1m',
        penalty: 'block',
    },
    // Visitor tracking (lenient)
    visitor: {
        requests: 30,
        window: '1m',
        penalty: 'none',
    },
    // Default fallback
    default: {
        requests: 60,
        window: '1m',
        penalty: 'block',
    },
};

// Parse window string to milliseconds
function parseWindow(window: string): number {
    const match = window.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 60000; // Default 1 minute

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 60000;
    }
}

// Get whitelist IPs from env
export function getWhitelistIPs(): string[] {
    const whitelist = process.env.WHITELIST_IPS || '';
    return whitelist.split(',').map(ip => ip.trim()).filter(Boolean);
}

// Check if IP is whitelisted
export function isWhitelisted(ip: string): boolean {
    const whitelist = getWhitelistIPs();
    return whitelist.includes(ip);
}

// In-memory rate limiter fallback
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

async function checkInMemoryLimit(
    identifier: string,
    config: ThrottleConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const windowMs = parseWindow(config.window);
    const key = `${identifier}:${config.requests}:${config.window}`;

    const entry = inMemoryStore.get(key);

    // Cleanup old entries periodically
    if (inMemoryStore.size > 10000) {
        for (const [k, v] of inMemoryStore.entries()) {
            if (now > v.resetTime) {
                inMemoryStore.delete(k);
            }
        }
    }

    if (!entry || now > entry.resetTime) {
        inMemoryStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            success: true,
            remaining: config.requests - 1,
            reset: Math.floor((now + windowMs) / 1000),
        };
    }

    if (entry.count >= config.requests) {
        return {
            success: false,
            remaining: 0,
            reset: Math.floor(entry.resetTime / 1000),
        };
    }

    entry.count++;
    inMemoryStore.set(key, entry);

    return {
        success: true,
        remaining: config.requests - entry.count,
        reset: Math.floor(entry.resetTime / 1000),
    };
}

// Calculate progressive penalty timeout
function calculatePenaltyTimeout(identifier: string, config: ThrottleConfig): number {
    const entry = violationStore.get(identifier);
    const now = Date.now();

    if (!entry) {
        // First violation
        violationStore.set(identifier, {
            count: 1,
            lastViolation: now,
            penaltyUntil: now + (config.baseTimeoutMs || 60000),
        });
        return config.baseTimeoutMs || 60000;
    }

    // Reset count if last violation was more than 24 hours ago
    if (now - entry.lastViolation > 24 * 60 * 60 * 1000) {
        violationStore.set(identifier, {
            count: 1,
            lastViolation: now,
            penaltyUntil: now + (config.baseTimeoutMs || 60000),
        });
        return config.baseTimeoutMs || 60000;
    }

    // Progressive penalty: T = base × factor^n
    const base = config.baseTimeoutMs || 60000;
    const factor = config.factor || 2;
    const timeout = Math.min(
        base * Math.pow(factor, entry.count),
        24 * 60 * 60 * 1000 // Max 24 hours
    );

    entry.count++;
    entry.lastViolation = now;
    entry.penaltyUntil = now + timeout;
    violationStore.set(identifier, entry);

    return timeout;
}

// Check if under penalty
function isUnderPenalty(identifier: string): { penalized: boolean; remaining: number } {
    const entry = violationStore.get(identifier);
    if (!entry) return { penalized: false, remaining: 0 };

    const now = Date.now();
    if (now < entry.penaltyUntil) {
        return { penalized: true, remaining: entry.penaltyUntil - now };
    }

    return { penalized: false, remaining: 0 };
}

export interface ThrottleResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;           // Unix timestamp (seconds)
    retryAfter?: number;     // Seconds until retry allowed
    penaltyCount?: number;   // Number of violations
    message?: string;
}

// Main throttle check function
export async function checkThrottle(
    ip: string,
    endpoint: string,
    configKey: string = 'default'
): Promise<ThrottleResult> {
    // Check whitelist
    if (isWhitelisted(ip)) {
        return {
            success: true,
            limit: 999999,
            remaining: 999999,
            reset: Math.floor(Date.now() / 1000) + 3600,
            message: 'Whitelisted IP',
        };
    }

    const config = THROTTLE_CONFIGS[configKey] || THROTTLE_CONFIGS.default;
    const identifier = `${ip}:${configKey}`;

    // Check if under progressive penalty
    if (config.penalty === 'progressive') {
        const { penalized, remaining } = isUnderPenalty(identifier);
        if (penalized) {
            const entry = violationStore.get(identifier);
            return {
                success: false,
                limit: config.requests,
                remaining: 0,
                reset: Math.floor((entry?.penaltyUntil || Date.now()) / 1000),
                retryAfter: Math.ceil(remaining / 1000),
                penaltyCount: entry?.count,
                message: `Rate limited. Retry after ${Math.ceil(remaining / 1000)} seconds.`,
            };
        }
    }

    // Try Upstash Redis first
    const redisClient = getRedis();

    if (redisClient) {
        try {
            const windowMs = parseWindow(config.window);
            const windowSeconds = Math.floor(windowMs / 1000);

            const ratelimit = new Ratelimit({
                redis: redisClient,
                limiter: Ratelimit.slidingWindow(config.requests, `${windowSeconds} s`),
                analytics: true,
                prefix: `throttle:${configKey}`,
            });

            const result = await ratelimit.limit(identifier);

            if (!result.success) {
                // Apply penalty if configured
                if (config.penalty === 'progressive') {
                    const timeout = calculatePenaltyTimeout(identifier, config);
                    const entry = violationStore.get(identifier);

                    return {
                        success: false,
                        limit: config.requests,
                        remaining: 0,
                        reset: Math.floor((entry?.penaltyUntil || Date.now()) / 1000),
                        retryAfter: Math.ceil(timeout / 1000),
                        penaltyCount: entry?.count,
                        message: `Rate limited with progressive penalty. Attempt #${entry?.count}`,
                    };
                }

                return {
                    success: false,
                    limit: config.requests,
                    remaining: result.remaining,
                    reset: Math.floor(result.reset / 1000),
                    retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
                    message: 'Rate limit exceeded',
                };
            }

            return {
                success: true,
                limit: config.requests,
                remaining: result.remaining,
                reset: Math.floor(result.reset / 1000),
            };
        } catch (error) {
            console.error('Upstash Redis error, falling back to in-memory:', error);
        }
    }

    // Fallback to in-memory
    const result = await checkInMemoryLimit(identifier, config);

    if (!result.success) {
        if (config.penalty === 'progressive') {
            const timeout = calculatePenaltyTimeout(identifier, config);
            const entry = violationStore.get(identifier);

            return {
                success: false,
                limit: config.requests,
                remaining: 0,
                reset: Math.floor((entry?.penaltyUntil || Date.now()) / 1000),
                retryAfter: Math.ceil(timeout / 1000),
                penaltyCount: entry?.count,
                message: `Rate limited with progressive penalty. Attempt #${entry?.count}`,
            };
        }

        return {
            success: false,
            limit: config.requests,
            remaining: 0,
            reset: result.reset,
            retryAfter: result.reset - Math.floor(Date.now() / 1000),
            message: 'Rate limit exceeded',
        };
    }

    return {
        success: true,
        limit: config.requests,
        remaining: result.remaining,
        reset: result.reset,
    };
}

// Generate rate limit headers
export function getRateLimitHeaders(result: ThrottleResult): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
    };

    if (result.retryAfter) {
        headers['Retry-After'] = String(result.retryAfter);
    }

    return headers;
}

// Get violation stats for dashboard
export function getViolationStats(): {
    topViolators: { ip: string; count: number; lastViolation: Date }[];
    totalViolations: number;
} {
    const entries = Array.from(violationStore.entries())
        .map(([key, entry]) => ({
            ip: key.split(':')[0],
            count: entry.count,
            lastViolation: new Date(entry.lastViolation),
        }))
        .sort((a, b) => b.count - a.count);

    return {
        topViolators: entries.slice(0, 10),
        totalViolations: entries.reduce((sum, e) => sum + e.count, 0),
    };
}

// Reset violations for an IP (for admin use)
export function resetViolations(ip: string): void {
    for (const key of violationStore.keys()) {
        if (key.startsWith(`${ip}:`)) {
            violationStore.delete(key);
        }
    }
}
