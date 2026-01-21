import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stats - Get dashboard statistics
export async function GET() {
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
            messageCount,
            unreadCount,
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
            prisma.message.count(),
            prisma.message.count({ where: { read: false } }),
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
            messages: {
                total: messageCount,
                unread: unreadCount,
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
