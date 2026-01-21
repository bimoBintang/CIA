import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Get channel messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        const { id: channelId } = await params;

        if (!currentUser || !currentUser.agentId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is a member of the channel
        const membership = await prisma.channelMember.findUnique({
            where: {
                channelId_agentId: {
                    channelId,
                    agentId: currentUser.agentId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'Not a member of this channel' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before');

        const messages = await prisma.channelMessage.findMany({
            where: {
                channelId,
                ...(before ? { createdAt: { lt: new Date(before) } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                sender: {
                    select: {
                        id: true,
                        codename: true,
                        status: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: messages.reverse(), // Return in chronological order
        });
    } catch (error) {
        console.error('Error fetching channel messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST - Send message to channel
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        const { id: channelId } = await params;

        if (!currentUser || !currentUser.agentId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check membership
        const membership = await prisma.channelMember.findUnique({
            where: {
                channelId_agentId: {
                    channelId,
                    agentId: currentUser.agentId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'Not a member of this channel' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { content, attachments } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Message content is required' },
                { status: 400 }
            );
        }

        const message = await prisma.channelMessage.create({
            data: {
                channelId,
                senderId: currentUser.agentId,
                content: content.trim(),
                attachments: attachments || [],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        codename: true,
                        status: true,
                    },
                },
            },
        });

        // Update channel updatedAt
        await prisma.channel.update({
            where: { id: channelId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({
            success: true,
            data: message,
        }, { status: 201 });
    } catch (error) {
        console.error('Error sending channel message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
