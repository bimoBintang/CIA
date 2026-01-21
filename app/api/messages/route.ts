import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/messages - List all messages (optionally filter by agent)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        const messages = await prisma.message.findMany({
            where: agentId ? {
                OR: [
                    { toId: agentId },
                    { fromId: agentId },
                ],
            } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                fromAgent: { select: { codename: true } },
                toAgent: { select: { codename: true } },
            },
        });

        const unreadCount = await prisma.message.count({
            where: { read: false },
        });

        return NextResponse.json({
            success: true,
            data: messages,
            count: messages.length,
            unread: unreadCount,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST /api/messages - Send new message
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fromId, toId, content } = body;

        if (!fromId || !toId || !content) {
            return NextResponse.json(
                { success: false, error: 'fromId, toId, and content are required' },
                { status: 400 }
            );
        }

        const newMessage = await prisma.message.create({
            data: {
                fromId,
                toId,
                content,
                read: false,
            },
        });

        return NextResponse.json(
            { success: true, data: newMessage },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        );
    }
}

// PATCH /api/messages - Mark message as read
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, read = true } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Message ID is required' },
                { status: 400 }
            );
        }

        const updatedMessage = await prisma.message.update({
            where: { id },
            data: { read },
        });

        return NextResponse.json({
            success: true,
            data: updatedMessage,
        });
    } catch (error) {
        console.error('Error updating message:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update message' },
            { status: 500 }
        );
    }
}
