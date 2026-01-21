import { prisma } from './prisma';

// Enhanced security threat detection and auto-ban system

interface ThreatEntry {
    count: number;
    lastAttempt: number;
    threats: string[];
    severity: number;
}

// In-memory threat tracking
const threatTracker = new Map<string, ThreatEntry>();
const requestCounter = new Map<string, { count: number; timestamp: number }>();

// ENHANCED Thresholds - More strict
const THREAT_THRESHOLDS = {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_SECOND: 10,
    MAX_FAILED_LOGINS: 5,
    MAX_SUSPICIOUS_REQUESTS: 3,
    TRACKING_WINDOW: 60000,
    AUTO_BAN_DURATION_MILD: 1 * 60 * 60 * 1000,
    AUTO_BAN_DURATION_MODERATE: 24 * 60 * 60 * 1000,
    AUTO_BAN_DURATION_SEVERE: 7 * 24 * 60 * 60 * 1000,
    AUTO_BAN_DURATION_PERMANENT: null as number | null,
};

// Attack patterns
const ATTACK_PATTERNS = {
    SQL_INJECTION: [
        /union\s+select/i,
        /select\s+.*\s+from/i,
        /insert\s+into/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /update\s+.*\s+set/i,
        /or\s+1\s*=\s*1/i,
        /and\s+1\s*=\s*1/i,
        /'\s*or\s*'/i,
        /--/,
        /sleep\s*\(/i,
        /benchmark\s*\(/i,
        /waitfor\s+delay/i,
        /load_file\s*\(/i,
        /into\s+outfile/i,
    ],
    XSS: [
        /<script/i,
        /javascript:/i,
        /onerror\s*=/i,
        /onload\s*=/i,
        /onclick\s*=/i,
        /onmouseover\s*=/i,
        /<iframe/i,
        /<embed/i,
        /<object/i,
        /vbscript:/i,
        /<svg.*onload/i,
        /<img.*onerror/i,
        /expression\s*\(/i,
        /eval\s*\(/i,
        /document\.cookie/i,
        /document\.location/i,
    ],
    PATH_TRAVERSAL: [
        /\.\.\//,
        /\.\.%2f/i,
        /%2e%2e/i,
        /\/etc\/passwd/i,
        /\/etc\/shadow/i,
        /\.htaccess/i,
        /\.env/i,
        /\.git\//i,
        /\/proc\/self/i,
        /\/var\/log/i,
        /web\.config/i,
        /\.bash_history/i,
    ],
    COMMAND_INJECTION: [
        /;\s*cat\s/i,
        /;\s*ls\s/i,
        /\|\s*cat/i,
        /\|\s*ls/i,
        /`.*`/,
        /\$\(.*\)/,
        /wget\s+http/i,
        /curl\s+http/i,
        /nc\s+-e/i,
        /\/bin\/sh/i,
        /\/bin\/bash/i,
        /&&\s*rm/i,
        /\|\s*bash/i,
    ],
    BOT_SCANNER: [
        /nikto/i,
        /sqlmap/i,
        /nmap/i,
        /dirbuster/i,
        /gobuster/i,
        /burpsuite/i,
        /acunetix/i,
        /nessus/i,
        /masscan/i,
        /w3af/i,
        /wpscan/i,
        /nuclei/i,
        /ffuf/i,
        /feroxbuster/i,
    ],
    DIRECTORY_ENUM: [
        /\/wp-admin/i,
        /\/phpmyadmin/i,
        /\/admin\//i,
        /\/\.git\/config/i,
        /\/debug/i,
        /\/swagger/i,
        /\/api-docs/i,
        /\/graphql/i,
        /\/actuator/i,
        /\/wp-content/i,
        /\/wp-includes/i,
        /\/backup/i,
        /\/database/i,
        /\/\.well-known/i,
    ],
    // NEW: XXE Injection
    XXE_INJECTION: [
        /<!DOCTYPE.*\[/i,
        /<!ENTITY/i,
        /SYSTEM\s*"/i,
        /file:\/\//i,
        /expect:\/\//i,
        /php:\/\//i,
        /data:\/\//i,
    ],
    // NEW: LDAP Injection
    LDAP_INJECTION: [
        /\)\(\|/,
        /\*\)\(/,
        /\)\)\|/,
        /\)\(!/,
        /\)\(&/,
    ],
    // NEW: NoSQL Injection
    NOSQL_INJECTION: [
        /\$where/i,
        /\$gt/i,
        /\$lt/i,
        /\$ne/i,
        /\$regex/i,
        /\$or\s*:/i,
        /\$and\s*:/i,
        /\{\s*"\$gt"/i,
        /\{\s*"\$ne"/i,
    ],
    // NEW: SSRF (Server-Side Request Forgery)
    SSRF: [
        /localhost/i,
        /127\.0\.0\.1/,
        /0\.0\.0\.0/,
        /169\.254\./,
        /192\.168\./,
        /10\.\d+\.\d+\.\d+/,
        /172\.(1[6-9]|2\d|3[01])\./,
        /\[::1\]/,
        /::ffff:/i,
        /file:\/\//i,
        /gopher:\/\//i,
        /dict:\/\//i,
        /metadata\.google/i,
        /instance-data/i,
    ],
    // NEW: Header Injection
    HEADER_INJECTION: [
        /%0d%0a/i,
        /%0d/i,
        /%0a/i,
        /\r\n/,
        /\r/,
        /\n/,
        /set-cookie:/i,
        /location:/i,
    ],
    // NEW: File Upload Attacks
    FILE_UPLOAD_ATTACK: [
        /\.php$/i,
        /\.php3$/i,
        /\.php4$/i,
        /\.php5$/i,
        /\.phtml$/i,
        /\.asp$/i,
        /\.aspx$/i,
        /\.jsp$/i,
        /\.jspx$/i,
        /\.exe$/i,
        /\.sh$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.svg\+xml/i,
        /image\/svg/i,
    ],
    // NEW: Prototype Pollution
    PROTOTYPE_POLLUTION: [
        /__proto__/,
        /constructor\[/,
        /prototype\[/,
        /\["__proto__"\]/,
        /\["constructor"\]/,
    ],
    // NEW: Template Injection
    TEMPLATE_INJECTION: [
        /\{\{.*\}\}/,
        /\$\{.*\}/,
        /<%= /,
        /<% /,
        /#\{.*\}/,
        /\[\[.*\]\]/,
    ],
};

export type ThreatType =
    | 'sql_injection'
    | 'xss'
    | 'path_traversal'
    | 'command_injection'
    | 'bot_scanner'
    | 'directory_enum'
    | 'xxe_injection'
    | 'ldap_injection'
    | 'nosql_injection'
    | 'ssrf'
    | 'header_injection'
    | 'file_upload_attack'
    | 'prototype_pollution'
    | 'template_injection'
    | 'rate_limit'
    | 'brute_force'
    | 'suspicious';

const THREAT_SEVERITY: Record<ThreatType, number> = {
    sql_injection: 10,
    command_injection: 10,
    xxe_injection: 10,
    ssrf: 9,
    prototype_pollution: 9,
    template_injection: 9,
    nosql_injection: 9,
    bot_scanner: 9,
    ldap_injection: 8,
    xss: 8,
    file_upload_attack: 8,
    header_injection: 7,
    path_traversal: 7,
    directory_enum: 5,
    brute_force: 6,
    rate_limit: 4,
    suspicious: 3,
};

export function detectThreats(input: string): ThreatType[] {
    const threats: ThreatType[] = [];
    if (!input) return threats;

    const checks: [keyof typeof ATTACK_PATTERNS, ThreatType][] = [
        ['SQL_INJECTION', 'sql_injection'],
        ['XSS', 'xss'],
        ['PATH_TRAVERSAL', 'path_traversal'],
        ['COMMAND_INJECTION', 'command_injection'],
        ['BOT_SCANNER', 'bot_scanner'],
        ['DIRECTORY_ENUM', 'directory_enum'],
        ['XXE_INJECTION', 'xxe_injection'],
        ['LDAP_INJECTION', 'ldap_injection'],
        ['NOSQL_INJECTION', 'nosql_injection'],
        ['SSRF', 'ssrf'],
        ['HEADER_INJECTION', 'header_injection'],
        ['FILE_UPLOAD_ATTACK', 'file_upload_attack'],
        ['PROTOTYPE_POLLUTION', 'prototype_pollution'],
        ['TEMPLATE_INJECTION', 'template_injection'],
    ];

    for (const [patternKey, threatType] of checks) {
        if (ATTACK_PATTERNS[patternKey].some((pattern) => pattern.test(input))) {
            threats.push(threatType);
        }
    }

    return threats;
}

export function trackThreat(ip: string, threatType: ThreatType): ThreatEntry {
    const now = Date.now();
    let entry = threatTracker.get(ip);

    if (!entry || now - entry.lastAttempt > THREAT_THRESHOLDS.TRACKING_WINDOW) {
        entry = { count: 0, lastAttempt: now, threats: [], severity: 0 };
    }

    entry.count++;
    entry.lastAttempt = now;
    entry.severity += THREAT_SEVERITY[threatType];

    if (!entry.threats.includes(threatType)) {
        entry.threats.push(threatType);
    }

    threatTracker.set(ip, entry);
    return entry;
}

export function shouldAutoBan(entry: ThreatEntry): { ban: boolean; duration: number | null } {
    if (entry.severity >= 15) {
        return { ban: true, duration: THREAT_THRESHOLDS.AUTO_BAN_DURATION_PERMANENT };
    }
    if (entry.severity >= 10 || entry.threats.includes('sql_injection') || entry.threats.includes('command_injection')) {
        return { ban: true, duration: THREAT_THRESHOLDS.AUTO_BAN_DURATION_SEVERE };
    }
    if (entry.count >= THREAT_THRESHOLDS.MAX_SUSPICIOUS_REQUESTS || entry.threats.length >= 2) {
        return { ban: true, duration: THREAT_THRESHOLDS.AUTO_BAN_DURATION_MODERATE };
    }
    if (entry.severity >= 5) {
        return { ban: true, duration: THREAT_THRESHOLDS.AUTO_BAN_DURATION_MILD };
    }
    return { ban: false, duration: null };
}

export async function autoBanIP(
    ip: string,
    reason: string,
    duration: number | null = THREAT_THRESHOLDS.AUTO_BAN_DURATION_MODERATE
): Promise<boolean> {
    try {
        const expiresAt = duration ? new Date(Date.now() + duration) : null;
        const durationText = duration
            ? `${Math.round(duration / (60 * 60 * 1000))} hours`
            : 'PERMANENT';

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

        threatTracker.delete(ip);
        console.log(`[SECURITY] 🚫 Auto-banned IP: ${ip} - Duration: ${durationText} - Reason: ${reason}`);
        return true;
    } catch (error) {
        console.error('Error auto-banning IP:', error);
        return false;
    }
}

export function trackRequestRate(ip: string): { count: number; shouldBlock: boolean } {
    const now = Date.now();
    let entry = requestCounter.get(ip);

    if (!entry || now - entry.timestamp > 1000) {
        entry = { count: 0, timestamp: now };
    }

    entry.count++;
    requestCounter.set(ip, entry);

    return {
        count: entry.count,
        shouldBlock: entry.count > THREAT_THRESHOLDS.MAX_REQUESTS_PER_SECOND,
    };
}

export async function securityCheck(
    ip: string,
    requestData: {
        url?: string;
        body?: string;
        query?: string;
        headers?: Record<string, string>;
        userAgent?: string;
    }
): Promise<{ blocked: boolean; reason?: string; severity?: number }> {
    const rateCheck = trackRequestRate(ip);
    if (rateCheck.shouldBlock) {
        const entry = trackThreat(ip, 'rate_limit');
        const banCheck = shouldAutoBan(entry);
        if (banCheck.ban) {
            await autoBanIP(ip, `Burst rate exceeded: ${rateCheck.count} req/sec`, banCheck.duration);
            return { blocked: true, reason: 'Rate limit exceeded', severity: 10 };
        }
        return { blocked: true, reason: 'Too many requests', severity: 4 };
    }

    if (requestData.userAgent) {
        const scannerThreats = detectThreats(requestData.userAgent);
        if (scannerThreats.includes('bot_scanner')) {
            await autoBanIP(ip, 'Vulnerability scanner detected', THREAT_THRESHOLDS.AUTO_BAN_DURATION_PERMANENT);
            return { blocked: true, reason: 'Malicious scanner detected', severity: 10 };
        }
    }

    const dataToScan = [
        requestData.url || '',
        requestData.body || '',
        requestData.query || '',
        JSON.stringify(requestData.headers || {}),
    ].join(' ');

    const threats = detectThreats(dataToScan);

    if (threats.length > 0) {
        const entry = trackThreat(ip, threats[0]);
        const banCheck = shouldAutoBan(entry);

        if (banCheck.ban) {
            const reason = `Attack detected: ${entry.threats.join(', ')} (severity: ${entry.severity})`;
            await autoBanIP(ip, reason, banCheck.duration);
            return { blocked: true, reason, severity: entry.severity };
        }

        return {
            blocked: false,
            reason: `Suspicious activity: ${threats.join(', ')}`,
            severity: entry.severity,
        };
    }

    return { blocked: false };
}

export async function trackFailedLogin(ip: string): Promise<boolean> {
    const entry = trackThreat(ip, 'brute_force');

    if (entry.count >= THREAT_THRESHOLDS.MAX_FAILED_LOGINS) {
        await autoBanIP(ip, `${entry.count} failed login attempts`, THREAT_THRESHOLDS.AUTO_BAN_DURATION_MODERATE);
        return true;
    }

    if (entry.count >= 3) {
        console.log(`[SECURITY] ⚠️ Warning: IP ${ip} has ${entry.count} failed logins`);
    }

    return false;
}

export async function trackRateLimit(ip: string, requestCount: number): Promise<boolean> {
    if (requestCount >= THREAT_THRESHOLDS.MAX_REQUESTS_PER_MINUTE) {
        await autoBanIP(ip, `Rate limit: ${requestCount} req/min`, THREAT_THRESHOLDS.AUTO_BAN_DURATION_MILD);
        return true;
    }
    return false;
}

export function getThreatStatus(ip: string): ThreatEntry | null {
    return threatTracker.get(ip) || null;
}

export async function logSecurityEvent(
    ip: string,
    eventType: ThreatType,
    details: string
): Promise<void> {
    const severity = THREAT_SEVERITY[eventType];
    const emoji = severity >= 8 ? '🚨' : severity >= 5 ? '⚠️' : 'ℹ️';
    console.log(`[SECURITY] ${emoji} IP: ${ip} | Type: ${eventType} | Severity: ${severity} | ${details}`);
}

export function cleanupThreatTracker(): void {
    const now = Date.now();
    for (const [ip, entry] of threatTracker.entries()) {
        if (now - entry.lastAttempt > THREAT_THRESHOLDS.TRACKING_WINDOW * 5) {
            threatTracker.delete(ip);
        }
    }
    for (const [ip, entry] of requestCounter.entries()) {
        if (now - entry.timestamp > 60000) {
            requestCounter.delete(ip);
        }
    }
}

if (typeof setInterval !== 'undefined') {
    setInterval(cleanupThreatTracker, 5 * 60 * 1000);
}
