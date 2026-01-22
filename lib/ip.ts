import { NextRequest } from 'next/server';

/**
 * Get real client IP address with Cloudflare support
 * Priority:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Real-IP (Nginx/other proxies)
 * 3. X-Forwarded-For (first IP in chain)
 * 4. Fallback to 'unknown'
 */
export function getClientIP(request: NextRequest): string {
    // Cloudflare header (most reliable when using Cloudflare)
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }

    // Real IP header (set by Nginx or other proxies)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }

    // X-Forwarded-For (can be spoofed, use first IP)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',');
        return ips[0].trim();
    }

    return 'unknown';
}

/**
 * Get Cloudflare country code
 */
export function getClientCountry(request: NextRequest): string | null {
    return request.headers.get('cf-ipcountry');
}

/**
 * Check if request is coming through Cloudflare
 */
export function isCloudflareRequest(request: NextRequest): boolean {
    return request.headers.has('cf-connecting-ip');
}

/**
 * Get all Cloudflare headers for debugging
 */
export function getCloudflareInfo(request: NextRequest): Record<string, string | null> {
    return {
        ip: request.headers.get('cf-connecting-ip'),
        country: request.headers.get('cf-ipcountry'),
        ray: request.headers.get('cf-ray'),
        visitor: request.headers.get('cf-visitor'),
    };
}
