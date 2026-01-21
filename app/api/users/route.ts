import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { isValidEmail, validatePassword, sanitizeString, isValidRole } from '@/lib/validation';

// GET - List all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                agent: {
                    select: {
                        id: true,
                        codename: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: users.map(u => ({
                ...u,
                password: undefined, // Don't expose password
            })),
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role, agentId } = body;

        // Validate email format
        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { success: false, error: passwordValidation.errors.join('. ') },
                { status: 400 }
            );
        }

        // Validate name
        const sanitizedName = sanitizeString(name);
        if (!sanitizedName || sanitizedName.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Name must be at least 2 characters' },
                { status: 400 }
            );
        }

        // Validate role if provided
        if (role && !isValidRole(role)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role. Must be ADMIN, SENIOR_AGENT, AGENT, or VIEWER' },
                { status: 400 }
            );
        }

        // Hash password with bcrypt
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                name: sanitizedName,
                role: role || 'AGENT',
                agentId: agentId || null,
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        codename: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: { ...user, password: undefined },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error creating user:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Email already exists' },
                { status: 400 }
            );
        }
        return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
    }
}

// PATCH - Update user role
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, role, agentId } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(agentId !== undefined && { agentId }),
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        codename: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: { ...user, password: undefined },
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}
