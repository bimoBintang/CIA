import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { applyThrottle } from '@/lib/throttle-helper';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Allowed file types
const ALLOWED_TYPES: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Generate secure filename
function generateSecureFilename(originalName: string, mimeType: string): string {
    const ext = ALLOWED_TYPES[mimeType]?.[0] || path.extname(originalName).toLowerCase();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomBytes}${ext}`;
}

// Sanitize original filename for logging
function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
}

export async function POST(request: NextRequest) {
    // Throttle check - upload config (strict: 10 req/hour)
    const throttle = await applyThrottle(request, 'upload');
    if (!throttle.passed) return throttle.response!;

    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
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

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum size is 20MB' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES[file.type]) {
            return NextResponse.json(
                { success: false, error: 'File type not allowed' },
                { status: 400 }
            );
        }

        // Create uploads directory if not exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate secure filename
        const secureFilename = generateSecureFilename(file.name, file.type);
        const filePath = path.join(uploadsDir, secureFilename);

        // Convert file to buffer and write
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Additional security: verify file magic bytes for images
        if (file.type.startsWith('image/')) {
            const isValidImage = validateImageMagicBytes(buffer, file.type);
            if (!isValidImage) {
                return NextResponse.json(
                    { success: false, error: 'Invalid image file' },
                    { status: 400 }
                );
            }
        }

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${secureFilename}`;

        return NextResponse.json({
            success: true,
            data: {
                url: fileUrl,
                filename: secureFilename,
                originalName: sanitizeFilename(file.name),
                size: file.size,
                type: file.type,
            },
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

// Validate image magic bytes for security
function validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const magicBytes: Record<string, number[][]> = {
        'image/jpeg': [[0xFF, 0xD8, 0xFF]],
        'image/png': [[0x89, 0x50, 0x4E, 0x47]],
        'image/gif': [[0x47, 0x49, 0x46, 0x38]],
        'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    };

    const expected = magicBytes[mimeType];
    if (!expected) return true; // Skip validation for unknown types

    for (const bytes of expected) {
        let match = true;
        for (let i = 0; i < bytes.length; i++) {
            if (buffer[i] !== bytes[i]) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }

    return false;
}
