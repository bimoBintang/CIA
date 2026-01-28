import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { applyThrottle } from '@/lib/throttle-helper';
import { validatePassword } from '@/lib/validation';

// POST /api/users/change-password - Change user password
export async function POST(request: NextRequest) {
    // Throttle check - write config (more strict for password changes)
    const throttle = await applyThrottle(request, 'write');
    if (!throttle.passed) return throttle.response!;

    try {
        // Get authenticated user
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword, confirmPassword } = body;

        // Validate required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'Semua field harus diisi' },
                { status: 400 }
            );
        }

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'Password baru tidak sama dengan konfirmasi' },
                { status: 400 }
            );
        }

        // Validate new password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { success: false, error: passwordValidation.errors.join('. ') },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, password: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Password saat ini salah' },
                { status: 401 }
            );
        }

        // Check if new password is different from current
        const isSamePassword = await verifyPassword(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                { success: false, error: 'Password baru harus berbeda dari password saat ini' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password in database
        await prisma.user.update({
            where: { id: session.userId },
            data: {
                password: hashedNewPassword,
                // Invalidate all sessions by clearing session token
                sessionToken: null,
                sessionCreatedAt: null,
                sessionDevice: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Password berhasil diubah. Silakan login kembali.',
        });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal mengubah password' },
            { status: 500 }
        );
    }
}
