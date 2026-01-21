// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxAttempts: 5,    // 5 attempts
    windowMs: 60000,   // per 1 minute
};

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }

    // No existing entry or expired
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetIn: config.windowMs,
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxAttempts) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
        allowed: true,
        remaining: config.maxAttempts - entry.count,
        resetIn: entry.resetTime - now,
    };
}

// Login-specific rate limiter (stricter)
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 5,     // 5 login attempts
    windowMs: 300000,   // per 5 minutes
};

// API rate limiter
export const API_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 100,   // 100 requests
    windowMs: 60000,    // per 1 minute
};

// Reset rate limit for a specific identifier
export function resetRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}
