import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import crypto from 'crypto';

// GET - Get operation with plans
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const operation = await prisma.operation.findUnique({
            where: { id },
            include: {
                plans: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!operation) {
            return NextResponse.json(
                { success: false, error: 'Operation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: operation,
        });
    } catch (error) {
        console.error('Error fetching operation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch operation' },
            { status: 500 }
        );
    }
}

// PATCH - Update operation
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, description, status, priority, progress, teamSize, deadline } = body;

        const updated = await prisma.operation.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(priority && { priority }),
                ...(progress !== undefined && { progress }),
                ...(teamSize && { teamSize }),
                ...(deadline && { deadline: new Date(deadline) }),
            },
        });

        return NextResponse.json({
            success: true,
            data: updated,
        });
    } catch (error) {
        console.error('Error updating operation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update operation' },
            { status: 500 }
        );
    }
}

// POST - Upload attachment to operation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const operation = await prisma.operation.findUnique({
            where: { id },
        });

        if (!operation) {
            return NextResponse.json(
                { success: false, error: 'Operation not found' },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: 'File too large (max 50MB)' },
                { status: 400 }
            );
        }

        // Generate secure filename
        const ext = file.name.split('.').pop() || 'file';
        const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
        const blobPath = `operations/${id}/${filename}`;

        // Upload to Vercel Blob
        const blob = await put(blobPath, file, {
            access: 'public',
            addRandomSuffix: false,
        });

        // Add to operation attachments
        await prisma.operation.update({
            where: { id },
            data: {
                attachments: {
                    push: blob.url,
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                url: blob.url,
                filename: file.name,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error uploading attachment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload attachment' },
            { status: 500 }
        );
    }
}

// DELETE - Delete operation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser || !['ADMIN', 'SENIOR_AGENT'].includes(currentUser.role)) {
            return NextResponse.json(
                { success: false, error: 'Permission denied' },
                { status: 403 }
            );
        }

        // Get operation to delete attachments
        const operation = await prisma.operation.findUnique({
            where: { id },
            include: { plans: true },
        });

        if (operation) {
            // Delete blob attachments
            for (const url of operation.attachments || []) {
                try { await del(url); } catch (e) { console.error('Failed to delete blob:', e); }
            }
            for (const plan of operation.plans || []) {
                for (const url of plan.attachments || []) {
                    try { await del(url); } catch (e) { console.error('Failed to delete blob:', e); }
                }
            }
        }

        await prisma.operation.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Operation deleted',
        });
    } catch (error) {
        console.error('Error deleting operation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete operation' },
            { status: 500 }
        );
    }
}
