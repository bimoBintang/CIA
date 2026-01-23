import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUserAgent } from '@/lib/user-agent';
import { getCurrentUser } from '@/lib/auth';
import { applyThrottle } from '@/lib/throttle-helper';
import { getClientIP } from '@/lib/ip';

interface GeoData {
    country?: string;
    city?: string;
    region?: string;
    isp?: string;
    org?: string;
    timezone?: string;
    lat?: number;
    lon?: number;
}

// Get geolocation from Cloudflare/Vercel headers, fallback to ip-api
async function getGeolocation(request: NextRequest, ip: string): Promise<GeoData> {
    // Priority 1: Cloudflare headers
    const cfCountry = request.headers.get('cf-ipcountry');
    const cfCity = request.headers.get('cf-ipcity');
    const cfRegion = request.headers.get('cf-region');
    const cfTimezone = request.headers.get('cf-timezone');

    // Priority 2: Vercel headers
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelRegion = request.headers.get('x-vercel-ip-country-region');
    const vercelTimezone = request.headers.get('x-vercel-ip-timezone');

    const country = cfCountry || vercelCountry || undefined;
    const city = cfCity || vercelCity || undefined;
    const region = cfRegion || vercelRegion || undefined;
    const timezone = cfTimezone || vercelTimezone || undefined;

    // If we have basic data from headers, use it
    if (country) {
        // Only fetch from ip-api if we need ISP/lat/lon data
        try {
            const response = await fetch(`${process.env.IP_API_URL}/${ip}?fields=isp,org,lat,lon`, {
                signal: AbortSignal.timeout(2000), // 2s timeout
            });
            if (response.ok) {
                const data = await response.json();
                return {
                    country,
                    city,
                    region,
                    timezone,
                    isp: data.isp,
                    org: data.org,
                    lat: data.lat,
                    lon: data.lon,
                };
            }
        } catch {
            // Ignore errors, just use header data
        }
        return { country, city, region, timezone };
    }

    // Priority 3: Full fallback to ip-api.com
    try {
        const response = await fetch(
            `${process.env.IP_API_URL}/${ip}?fields=status,country,city,regionName,isp,org,timezone,lat,lon`,
            { signal: AbortSignal.timeout(3000) }
        );
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                return {
                    country: data.country,
                    city: data.city,
                    region: data.regionName,
                    isp: data.isp,
                    org: data.org,
                    timezone: data.timezone,
                    lat: data.lat,
                    lon: data.lon,
                };
            }
        }
    } catch {
        // Ignore errors
    }

    return {};
}

// Mask IP for display (192.168.1.123 -> 192.168.1.***)
export function maskIP(ip: string): string {
    if (ip.includes(':')) {
        // IPv6: mask last 4 groups
        const parts = ip.split(':');
        if (parts.length >= 4) {
            return parts.slice(0, 4).join(':') + ':****:****:****:****';
        }
    }
    // IPv4: mask last octet
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
    return ip;
}

// POST - Log visitor
export async function POST(request: NextRequest) {
    // Throttle check - visitor config (lenient, no penalty)
    const throttle = await applyThrottle(request, 'visitor');
    if (!throttle.passed) return throttle.response!;

    try {
        const body = await request.json();
        const { page, referer, fingerprint } = body;

        // Get client info (supports Cloudflare)
        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || 'Unknown';

        // Parse user agent
        const parsed = parseUserAgent(userAgent);

        // Get geolocation (async, but don't block)
        const geoPromise = getGeolocation(request, ip);

        // Get current user if logged in
        const currentUser = await getCurrentUser();
        const geo = await geoPromise;

        // Create visitor log
        const log = await prisma.visitorLog.create({
            data: {
                ip,
                userAgent,
                device: parsed.device,
                browser: parsed.browser,
                os: parsed.os,
                country: geo.country,
                city: geo.city,
                region: geo.region,
                isp: geo.isp,
                org: geo.org,
                timezone: geo.timezone,
                latitude: geo.lat,
                longitude: geo.lon,
                fingerprint: fingerprint || null,
                page: page || '/',
                referer: referer || null,
                userId: currentUser?.userId || null,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: log.id,
                device: parsed.device,
                browser: parsed.browser,
                os: parsed.os,
            },
        });
    } catch (error) {
        console.error('Error logging visitor:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to log visitor' },
            { status: 500 }
        );
    }
}

// GET - Get visitor logs (admin only)
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        // Only admins can view visitor logs
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.visitorLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                select: {
                    id: true,
                    ip: true,
                    device: true,
                    browser: true,
                    os: true,
                    country: true,
                    city: true,
                    region: true,
                    isp: true,
                    timezone: true,
                    fingerprint: true,
                    page: true,
                    referer: true,
                    userId: true,
                    createdAt: true,
                },
            }),
            prisma.visitorLog.count(),
        ]);

        // Mask IPs in response
        const maskedLogs = logs.map(log => ({
            ...log,
            ip: maskIP(log.ip),
            ipFull: log.ip, // Keep full IP for admin (can be removed if needed)
        }));

        // Get stats
        const [uniqueIPs, deviceStats, browserStats, countryStats] = await Promise.all([
            prisma.visitorLog.groupBy({ by: ['ip'] }),
            prisma.visitorLog.groupBy({
                by: ['device'],
                _count: { device: true },
            }),
            prisma.visitorLog.groupBy({
                by: ['browser'],
                _count: { browser: true },
                orderBy: { _count: { browser: 'desc' } },
                take: 5,
            }),
            prisma.visitorLog.groupBy({
                by: ['country'],
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 10,
                where: { country: { not: null } },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: maskedLogs,
            stats: {
                total,
                uniqueVisitors: uniqueIPs.length,
                devices: deviceStats.reduce((acc: Record<string, number>, d: typeof deviceStats[number]) => {
                    acc[d.device] = d._count.device;
                    return acc;
                }, {} as Record<string, number>),
                topBrowsers: browserStats.map((b: typeof browserStats[number]) => ({
                    browser: b.browser,
                    count: b._count.browser,
                })),
                topCountries: countryStats.map((c: typeof countryStats[number]) => ({
                    country: c.country || 'Unknown',
                    count: c._count.country,
                })),
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching visitor logs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch visitor logs' },
            { status: 500 }
        );
    }
}
