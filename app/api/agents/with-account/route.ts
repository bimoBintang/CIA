import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { applyThrottle } from '@/lib/throttle-helper';
import { isValidEmail, validatePassword, sanitizeString, isValidRole, isValidCodename } from '@/lib/validation';

// POST /api/agents/with-account - Create Agent + User atomically
export async function POST(request: NextRequest) {
    // Throttle check - write config
    const throttle = await applyThrottle(request, 'write');
    if (!throttle.passed) return throttle.response!;

    try {
        const body = await request.json();
        const { codename, email, password, faculty, level = 'Junior', role = 'AGENT' } = body;

        // ========== VALIDATION PHASE (before any DB operations) ==========

        // Validate codename
        const sanitizedCodename = sanitizeString(codename);
        if (!sanitizedCodename || !isValidCodename(sanitizedCodename)) {
            return NextResponse.json(
                { success: false, error: 'Codename harus alphanumeric, minimal 2 karakter' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'Format email tidak valid' },
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

        // Validate faculty
        const sanitizedFaculty = sanitizeString(faculty);
        if (!sanitizedFaculty || sanitizedFaculty.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Faculty harus minimal 2 karakter' },
                { status: 400 }
            );
        }

        // Validate role
        if (role && !isValidRole(role)) {
            return NextResponse.json(
                { success: false, error: 'Role tidak valid. Harus ADMIN, SENIOR_AGENT, AGENT, atau VIEWER' },
                { status: 400 }
            );
        }

        // Check if email already exists in Agent or User
        const normalizedEmail = email.toLowerCase().trim();

        const existingAgent = await prisma.agent.findUnique({ where: { email: normalizedEmail } });
        if (existingAgent) {
            return NextResponse.json(
                { success: false, error: 'Email sudah terdaftar sebagai agent' },
                { status: 409 }
            );
        }

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email sudah terdaftar sebagai user' },
                { status: 409 }
            );
        }

        // Check if codename already exists
        const existingCodename = await prisma.agent.findUnique({ where: { codename: sanitizedCodename } });
        if (existingCodename) {
            return NextResponse.json(
                { success: false, error: 'Codename sudah digunakan' },
                { status: 409 }
            );
        }

        // ========== DATABASE TRANSACTION (atomic operation) ==========

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Use transaction to create both Agent and User atomically
        const result = await prisma.$transaction(async (tx) => {
            // Create Agent first
            const newAgent = await tx.agent.create({
                data: {
                    codename: sanitizedCodename,
                    email: normalizedEmail,
                    faculty: sanitizedFaculty,
                    level,
                    status: 'offline',
                    missions: 0,
                },
            });

            // Create User linked to Agent
            const newUser = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    password: hashedPassword,
                    name: sanitizedCodename,
                    role,
                    agentId: newAgent.id,
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

            return { agent: newAgent, user: { ...newUser, password: undefined } };
        });

        return NextResponse.json(
            {
                success: true,
                data: result,
                message: 'Agent dan akun berhasil dibuat!'
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error creating agent with account:', error);

        // Handle Prisma unique constraint errors
        if (error && typeof error === 'object' && 'code' in error) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { success: false, error: 'Email atau codename sudah terdaftar' },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Gagal membuat agent dan akun' },
            { status: 500 }
        );
    }
}
