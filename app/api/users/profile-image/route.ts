import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { applyThrottle } from '@/lib/throttle-helper';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/users/profile-image - Upload profile image
export async function POST(request: NextRequest) {
    // Throttle check - write config
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

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum 5MB' },
                { status: 400 }
            );
        }

        // Create uploads directory if not exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${session.userId}-${Date.now()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Write file to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);

        // Generate public URL
        const imageUrl = `/uploads/profiles/${filename}`;

        // Update user profile image in database
        const updatedUser = await prisma.user.update({
            where: { id: session.userId },
            data: { profileImage: imageUrl },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: 'Profile image updated successfully',
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload profile image' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/profile-image - Remove profile image
export async function DELETE(request: NextRequest) {
    // Throttle check - write config
    const throttle = await applyThrottle(request, 'write');
    if (!throttle.passed) return throttle.response!;

    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Remove profile image from database
        const updatedUser = await prisma.user.update({
            where: { id: session.userId },
            data: { profileImage: null },
            select: {
                id: true,
                name: true,
                profileImage: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: 'Profile image removed',
        });
    } catch (error) {
        console.error('Error removing profile image:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove profile image' },
            { status: 500 }
        );
    }
}
