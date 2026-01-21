import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all channels for current user
export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get channels where user is a member
        const channels = await prisma.channel.findMany({
            where: {
                members: {
                    some: {
                        agentId: currentUser.agentId || undefined,
                    },
                },
            },
            include: {
                members: {
                    include: {
                        agent: {
                            select: {
                                id: true,
                                codename: true,
                                status: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                codename: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: channels,
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}

// POST - Create a new channel
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !currentUser.agentId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Agent required' },
                { status: 401 }
            );
        }

        // Only ADMIN and SENIOR_AGENT can create channels
        if (!['ADMIN', 'SENIOR_AGENT'].includes(currentUser.role)) {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, type, memberIds } = body;

        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Channel name is required (min 2 characters)' },
                { status: 400 }
            );
        }

        // Create channel with creator as admin member
        const channel = await prisma.channel.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                type: type || 'group',
                createdBy: currentUser.userId,
                members: {
                    create: [
                        { agentId: currentUser.agentId, role: 'admin' },
                        ...(memberIds || []).map((agentId: string) => ({
                            agentId,
                            role: 'member',
                        })),
                    ],
                },
            },
            include: {
                members: {
                    include: {
                        agent: {
                            select: {
                                id: true,
                                codename: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: channel,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating channel:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create channel' },
            { status: 500 }
        );
    }
}
