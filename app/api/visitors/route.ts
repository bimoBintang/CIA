import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUserAgent } from '@/lib/user-agent';
import { getCurrentUser } from '@/lib/auth';
import { getClientIP } from '@/lib/ip';

// POST - Log visitor
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { page, referer } = body;

        // Get client info (supports Cloudflare)
        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || 'Unknown';

        // Parse user agent
        const parsed = parseUserAgent(userAgent);

        // Get current user if logged in
        const currentUser = await getCurrentUser();

        // Create visitor log
        const log = await prisma.visitorLog.create({
            data: {
                ip,
                userAgent,
                device: parsed.device,
                browser: parsed.browser,
                os: parsed.os,
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
                    page: true,
                    referer: true,
                    userId: true,
                    createdAt: true,
                },
            }),
            prisma.visitorLog.count(),
        ]);

        // Get unique visitor stats
        const uniqueIPs = await prisma.visitorLog.groupBy({
            by: ['ip'],
        });

        const deviceStats = await prisma.visitorLog.groupBy({
            by: ['device'],
            _count: { device: true },
        });

        const browserStats = await prisma.visitorLog.groupBy({
            by: ['browser'],
            _count: { browser: true },
            orderBy: { _count: { browser: 'desc' } },
            take: 5,
        });

        return NextResponse.json({
            success: true,
            data: logs,
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
