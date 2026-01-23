import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyThrottle } from '@/lib/throttle-helper';

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
    // Throttle check - read config
    const throttle = await applyThrottle(request, 'read');
    if (!throttle.passed) return throttle.response!;

    try {
        const [
            agentCount,
            onlineCount,
            awayCount,
            offlineCount,
            seniorCount,
            intermediateCount,
            juniorCount,
            operationCount,
            activeOpCount,
            planningOpCount,
            completedOpCount,
            intelCount,
            highPriorityCount,
            mediumPriorityCount,
            lowPriorityCount,
            newsCount,
            publishedNewsCount,
            pendingAppCount,
        ] = await Promise.all([
            prisma.agent.count(),
            prisma.agent.count({ where: { status: 'online' } }),
            prisma.agent.count({ where: { status: 'away' } }),
            prisma.agent.count({ where: { status: 'offline' } }),
            prisma.agent.count({ where: { level: 'Senior' } }),
            prisma.agent.count({ where: { level: 'Intermediate' } }),
            prisma.agent.count({ where: { level: 'Junior' } }),
            prisma.operation.count(),
            prisma.operation.count({ where: { status: 'active' } }),
            prisma.operation.count({ where: { status: 'planning' } }),
            prisma.operation.count({ where: { status: 'completed' } }),
            prisma.intel.count(),
            prisma.intel.count({ where: { priority: 'high' } }),
            prisma.intel.count({ where: { priority: 'medium' } }),
            prisma.intel.count({ where: { priority: 'low' } }),
            prisma.news.count(),
            prisma.news.count({ where: { published: true } }),
            prisma.application.count({ where: { status: 'pending' } }),
        ]);

        const stats = {
            agents: {
                total: agentCount,
                online: onlineCount,
                away: awayCount,
                offline: offlineCount,
                byLevel: {
                    senior: seniorCount,
                    intermediate: intermediateCount,
                    junior: juniorCount,
                },
            },
            operations: {
                total: operationCount,
                active: activeOpCount,
                planning: planningOpCount,
                completed: completedOpCount,
            },
            intel: {
                total: intelCount,
                high: highPriorityCount,
                medium: mediumPriorityCount,
                low: lowPriorityCount,
            },
            news: {
                total: newsCount,
                published: publishedNewsCount,
            },
            applications: {
                pending: pendingAppCount,
            },
        };

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
