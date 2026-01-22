import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import crypto from 'crypto';

// GET - Get all plans for operation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: operationId } = await params;

        const plans = await prisma.operationPlan.findMany({
            where: { operationId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: plans,
            count: plans.length,
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch plans' },
            { status: 500 }
        );
    }
}

// POST - Create new plan
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: operationId } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if operation exists
        const operation = await prisma.operation.findUnique({
            where: { id: operationId },
        });

        if (!operation) {
            return NextResponse.json(
                { success: false, error: 'Operation not found' },
                { status: 404 }
            );
        }

        const contentType = request.headers.get('content-type') || '';

        // Handle file upload with plan
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const title = formData.get('title') as string;
            const content = formData.get('content') as string | null;
            const files = formData.getAll('files') as File[];

            if (!title) {
                return NextResponse.json(
                    { success: false, error: 'Title is required' },
                    { status: 400 }
                );
            }

            const attachmentUrls: string[] = [];

            // Upload files
            for (const file of files) {
                if (file.size > 50 * 1024 * 1024) continue; // Skip files > 50MB

                const ext = file.name.split('.').pop() || 'file';
                const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
                const blobPath = `operations/${operationId}/plans/${filename}`;

                const blob = await put(blobPath, file, {
                    access: 'public',
                    addRandomSuffix: false,
                });
                attachmentUrls.push(blob.url);
            }

            const plan = await prisma.operationPlan.create({
                data: {
                    operationId,
                    title,
                    content,
                    attachments: attachmentUrls,
                },
            });

            return NextResponse.json({
                success: true,
                data: plan,
            }, { status: 201 });
        } else {
            // Handle JSON request
            const body = await request.json();
            const { title, content } = body;

            if (!title) {
                return NextResponse.json(
                    { success: false, error: 'Title is required' },
                    { status: 400 }
                );
            }

            const plan = await prisma.operationPlan.create({
                data: {
                    operationId,
                    title,
                    content,
                },
            });

            return NextResponse.json({
                success: true,
                data: plan,
            }, { status: 201 });
        }
    } catch (error) {
        console.error('Error creating plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create plan' },
            { status: 500 }
        );
    }
}

// PATCH - Update plan status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: operationId } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { planId, title, content, status } = body;

        if (!planId) {
            return NextResponse.json(
                { success: false, error: 'Plan ID is required' },
                { status: 400 }
            );
        }

        const plan = await prisma.operationPlan.update({
            where: { id: planId, operationId },
            data: {
                ...(title && { title }),
                ...(content !== undefined && { content }),
                ...(status && { status }),
            },
        });

        return NextResponse.json({
            success: true,
            data: plan,
        });
    } catch (error) {
        console.error('Error updating plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update plan' },
            { status: 500 }
        );
    }
}

// DELETE - Delete plan
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: operationId } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const planId = searchParams.get('planId');

        if (!planId) {
            return NextResponse.json(
                { success: false, error: 'Plan ID is required' },
                { status: 400 }
            );
        }

        // Get plan to delete attachments
        const plan = await prisma.operationPlan.findUnique({
            where: { id: planId, operationId },
        });

        if (plan) {
            for (const url of plan.attachments || []) {
                try { await del(url); } catch (e) { console.error('Failed to delete blob:', e); }
            }
        }

        await prisma.operationPlan.delete({
            where: { id: planId, operationId },
        });

        return NextResponse.json({
            success: true,
            message: 'Plan deleted',
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete plan' },
            { status: 500 }
        );
    }
}
