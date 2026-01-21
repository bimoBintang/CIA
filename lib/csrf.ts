import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const CSRF_SECRET = new TextEncoder().encode(
    process.env.CSRF_SECRET || 'csrf-secret-key-2026'
);

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Generate CSRF token
export async function generateCsrfToken(): Promise<string> {
    const token = await new SignJWT({ type: 'csrf' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(CSRF_SECRET);

    return token;
}

// Set CSRF cookie
export async function setCsrfCookie(): Promise<string> {
    const token = await generateCsrfToken();
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hour
        path: '/',
    });

    return token;
}

// Verify CSRF token from header matches cookie
export async function verifyCsrfToken(headerToken: string | null): Promise<boolean> {
    if (!headerToken) return false;

    try {
        const cookieStore = await cookies();
        const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

        if (!cookieToken) return false;
        if (headerToken !== cookieToken) return false;

        // Verify token is valid JWT
        await jwtVerify(headerToken, CSRF_SECRET);
        return true;
    } catch {
        return false;
    }
}

// Get CSRF token from cookie
export async function getCsrfToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

// CSRF validation for API routes
export async function validateCsrfFromRequest(request: Request): Promise<boolean> {
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    return verifyCsrfToken(headerToken);
}
