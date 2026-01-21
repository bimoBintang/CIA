import { prisma } from './prisma';

// In-memory cache for banned IPs (reduces DB queries)
let bannedIPCache: Set<string> = new Set();
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

// Refresh the banned IP cache
async function refreshBannedIPCache(): Promise<void> {
    try {
        const now = new Date();
        const bannedIPs = await prisma.bannedIP.findMany({
            where: {
                OR: [
                    { expiresAt: null }, // Permanent bans
                    { expiresAt: { gt: now } }, // Not expired yet
                ],
            },
            select: { ip: true },
        });

        bannedIPCache = new Set(bannedIPs.map((b: { ip: string }) => b.ip));
        cacheTimestamp = Date.now();
    } catch (error) {
        console.error('Error refreshing banned IP cache:', error);
    }
}

// Check if an IP is banned
export async function isIPBanned(ip: string): Promise<boolean> {
    // Refresh cache if expired
    if (Date.now() - cacheTimestamp > CACHE_DURATION) {
        await refreshBannedIPCache();
    }

    return bannedIPCache.has(ip);
}

// Check if IP is banned with details
export async function getBanDetails(ip: string): Promise<{
    banned: boolean;
    reason?: string;
    expiresAt?: Date | null;
} | null> {
    try {
        const now = new Date();
        const ban = await prisma.bannedIP.findFirst({
            where: {
                ip,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
        });

        if (!ban) {
            return { banned: false };
        }

        return {
            banned: true,
            reason: ban.reason,
            expiresAt: ban.expiresAt,
        };
    } catch (error) {
        console.error('Error checking ban details:', error);
        return null;
    }
}

// Clear expired bans (run periodically)
export async function cleanupExpiredBans(): Promise<number> {
    try {
        const result = await prisma.bannedIP.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                    not: null,
                },
            },
        });
        return result.count;
    } catch (error) {
        console.error('Error cleaning up expired bans:', error);
        return 0;
    }
}

// Force refresh cache (after ban/unban)
export function invalidateBanCache(): void {
    cacheTimestamp = 0;
}
