import { prisma } from './prisma';

// Security threat detection and auto-ban system

interface ThreatEntry {
    count: number;
    lastAttempt: number;
    threats: string[];
}

// In-memory threat tracking
const threatTracker = new Map<string, ThreatEntry>();

// Thresholds for auto-ban
const THREAT_THRESHOLDS = {
    MAX_REQUESTS_PER_MINUTE: 100,      // DDoS protection
    MAX_FAILED_LOGINS: 10,              // Brute force protection
    MAX_SUSPICIOUS_REQUESTS: 5,         // Attack pattern detection
    TRACKING_WINDOW: 60000,             // 1 minute
    AUTO_BAN_DURATION: 24 * 60 * 60 * 1000, // 24 hours
};

// Suspicious patterns to detect
const ATTACK_PATTERNS = {
    SQL_INJECTION: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /(union|select|insert|update|delete|drop|truncate|alter|exec|execute)/i,
    ],
    XSS: [
        /<script[^>]*>[\s\S]*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        /<img[^>]*onerror/i,
    ],
    PATH_TRAVERSAL: [
        /\.\.\//g,
        /\.\.%2f/gi,
        /%2e%2e%2f/gi,
        /\.\.%5c/gi,
    ],
    COMMAND_INJECTION: [
        /;|\||`|\$\(|&&|\|\|/,
        /\b(cat|ls|pwd|whoami|id|uname|wget|curl|nc|bash|sh|cmd|powershell)\b/i,
    ],
};

export type ThreatType = 'sql_injection' | 'xss' | 'path_traversal' | 'command_injection' | 'rate_limit' | 'brute_force' | 'suspicious';

// Detect threats in request
export function detectThreats(input: string): ThreatType[] {
    const threats: ThreatType[] = [];

    if (!input) return threats;

    // Check SQL injection
    if (ATTACK_PATTERNS.SQL_INJECTION.some(pattern => pattern.test(input))) {
        threats.push('sql_injection');
    }

    // Check XSS
    if (ATTACK_PATTERNS.XSS.some(pattern => pattern.test(input))) {
        threats.push('xss');
    }

    // Check path traversal
    if (ATTACK_PATTERNS.PATH_TRAVERSAL.some(pattern => pattern.test(input))) {
        threats.push('path_traversal');
    }

    // Check command injection
    if (ATTACK_PATTERNS.COMMAND_INJECTION.some(pattern => pattern.test(input))) {
        threats.push('command_injection');
    }

    return threats;
}

// Track threat for an IP
export function trackThreat(ip: string, threatType: ThreatType): ThreatEntry {
    const now = Date.now();
    let entry = threatTracker.get(ip);

    if (!entry || now - entry.lastAttempt > THREAT_THRESHOLDS.TRACKING_WINDOW) {
        entry = { count: 0, lastAttempt: now, threats: [] };
    }

    entry.count++;
    entry.lastAttempt = now;
    if (!entry.threats.includes(threatType)) {
        entry.threats.push(threatType);
    }

    threatTracker.set(ip, entry);
    return entry;
}

// Check if IP should be auto-banned
export function shouldAutoBan(entry: ThreatEntry): boolean {
    // Auto-ban if too many suspicious requests
    if (entry.count >= THREAT_THRESHOLDS.MAX_SUSPICIOUS_REQUESTS) {
        return true;
    }

    // Auto-ban if multiple threat types detected
    if (entry.threats.length >= 2) {
        return true;
    }

    return false;
}

// Auto-ban an IP
export async function autoBanIP(
    ip: string,
    reason: string,
    duration: number = THREAT_THRESHOLDS.AUTO_BAN_DURATION
): Promise<boolean> {
    try {
        const expiresAt = new Date(Date.now() + duration);

        await prisma.bannedIP.upsert({
            where: { ip },
            update: {
                reason: `[AUTO-BAN] ${reason}`,
                expiresAt,
                updatedAt: new Date(),
            },
            create: {
                ip,
                reason: `[AUTO-BAN] ${reason}`,
                bannedBy: 'system',
                expiresAt,
            },
        });

        // Clear threat tracker for this IP
        threatTracker.delete(ip);

        console.log(`[SECURITY] Auto-banned IP: ${ip} - Reason: ${reason}`);
        return true;
    } catch (error) {
        console.error('Error auto-banning IP:', error);
        return false;
    }
}

// Main security check function
export async function securityCheck(
    ip: string,
    requestData: {
        url?: string;
        body?: string;
        query?: string;
        headers?: Record<string, string>;
    }
): Promise<{ blocked: boolean; reason?: string }> {
    // Combine all request data for scanning
    const dataToScan = [
        requestData.url || '',
        requestData.body || '',
        requestData.query || '',
        JSON.stringify(requestData.headers || {}),
    ].join(' ');

    // Detect threats
    const threats = detectThreats(dataToScan);

    if (threats.length > 0) {
        // Track the threat
        const entry = trackThreat(ip, threats[0]);

        // Check if should auto-ban
        if (shouldAutoBan(entry)) {
            const reason = `Multiple attack attempts detected: ${entry.threats.join(', ')}`;
            await autoBanIP(ip, reason);
            return { blocked: true, reason };
        }

        return {
            blocked: false,
            reason: `Suspicious activity detected: ${threats.join(', ')}`,
        };
    }

    return { blocked: false };
}

// Track failed login attempt
export async function trackFailedLogin(ip: string): Promise<boolean> {
    const entry = trackThreat(ip, 'brute_force');

    if (entry.count >= THREAT_THRESHOLDS.MAX_FAILED_LOGINS) {
        await autoBanIP(ip, `${entry.count} failed login attempts`);
        return true; // Banned
    }

    return false;
}

// Track rate limit violation
export async function trackRateLimit(ip: string, requestCount: number): Promise<boolean> {
    if (requestCount >= THREAT_THRESHOLDS.MAX_REQUESTS_PER_MINUTE) {
        await autoBanIP(ip, `Rate limit exceeded: ${requestCount} requests/min`, 60 * 60 * 1000); // 1 hour ban
        return true; // Banned
    }

    return false;
}

// Log security event
export async function logSecurityEvent(
    ip: string,
    eventType: ThreatType,
    details: string
): Promise<void> {
    console.log(`[SECURITY EVENT] IP: ${ip} | Type: ${eventType} | Details: ${details}`);
    // Could also store in database for security audit log
}

// Clean up old threat entries periodically
export function cleanupThreatTracker(): void {
    const now = Date.now();
    for (const [ip, entry] of threatTracker.entries()) {
        if (now - entry.lastAttempt > THREAT_THRESHOLDS.TRACKING_WINDOW * 2) {
            threatTracker.delete(ip);
        }
    }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupThreatTracker, 5 * 60 * 1000);
}
