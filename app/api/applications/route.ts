import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/applications - List all applications
export async function GET() {
    try {
        const applications = await prisma.application.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({
            success: true,
            data: applications,
            count: applications.length,
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}

// POST /api/applications - Submit new application
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, faculty, reason } = body;

        if (!name || !email || !faculty || !reason) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        const newApplication = await prisma.application.create({
            data: {
                name,
                email,
                faculty,
                reason,
                status: 'pending',
            },
        });

        return NextResponse.json(
            { success: true, data: newApplication, message: 'Application submitted successfully' },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error creating application:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Application with this email already exists' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to submit application' },
            { status: 500 }
        );
    }
}

// PATCH /api/applications - Update application status
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json(
                { success: false, error: 'ID and status are required' },
                { status: 400 }
            );
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({
            success: true,
            data: updatedApplication,
        });
    } catch (error) {
        console.error('Error updating application:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update application' },
            { status: 500 }
        );
    }
}
