import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'circle-cia-secret-key-2026'
);

// Protected routes
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login'];

// In-memory banned IP cache for edge runtime
const bannedIPCache = new Map<string, { banned: boolean; expiresAt: number }>();
const CACHE_TTL = 60000; // 1 minute

// Get client IP with Cloudflare support (inline for Edge Runtime)
function getClientIP(request: NextRequest): string {
    // Cloudflare header (most reliable)
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP.trim();

    // Real IP (Nginx/proxies)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP.trim();

    // X-Forwarded-For (first IP)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();

    return 'unknown';
}

async function checkBannedIP(ip: string, baseUrl: string): Promise<{ banned: boolean; reason?: string }> {
    // Check cache first
    const cached = bannedIPCache.get(ip);
    if (cached && Date.now() < cached.expiresAt) {
        return { banned: cached.banned };
    }

    try {
        // Call internal API to check ban status
        const res = await fetch(`${baseUrl}/api/banned-ips/check?ip=${encodeURIComponent(ip)}`, {
            cache: 'no-store',
        });
        const data = await res.json();

        // Cache result
        bannedIPCache.set(ip, {
            banned: data.banned,
            expiresAt: Date.now() + CACHE_TTL,
        });

        return data;
    } catch (error) {
        console.error('Error checking banned IP:', error);
        return { banned: false };
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';

    // Subdomain routing (Rewrites)
    if (host.startsWith('auth.')) {
        // Rewrite auth.* to /login unless it's already there or an api/static file
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/login', request.url));
        }
    }

    if (host.startsWith('dashboard.')) {
        // Rewrite dashboard.* root to /dashboard
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/dashboard', request.url));
        }
    }

    // Get client IP (supports Cloudflare)
    const ip = getClientIP(request);

    // Check if IP is banned (skip for API routes to avoid infinite loop)
    if (!pathname.startsWith('/api/banned-ips')) {
        const banCheck = await checkBannedIP(ip, request.nextUrl.origin);
        if (banCheck.banned) {
            // Return banned page
            return new NextResponse(
                `<!DOCTYPE html>
                <html>
                <head>
                    <title>Access Denied | Circle CIA</title>
                    <style>
                        body { 
                            background: #0a0a0a; 
                            color: #fff; 
                            font-family: monospace;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                        }
                        .container {
                            text-align: center;
                            padding: 40px;
                            border: 1px solid #ef4444;
                            border-radius: 16px;
                            background: rgba(239,68,68,0.1);
                            max-width: 500px;
                        }
                        h1 { color: #ef4444; font-size: 48px; margin: 0 0 20px; }
                        p { color: #a1a1aa; line-height: 1.6; }
                        .ip { color: #fbbf24; margin-top: 20px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚫 ACCESS DENIED</h1>
                        <p>Your IP address has been banned from accessing this website.</p>
                        <p>If you believe this is a mistake, please contact the administrator.</p>
                        <p class="ip">IP: ${ip}</p>
                    </div>
                </body>
                </html>`,
                {
                    status: 403,
                    headers: { 'Content-Type': 'text/html' },
                }
            );
        }
    }

    const token = request.cookies.get('auth-token')?.value;

    // Check if user is authenticated and get role
    let isAuthenticated = false;
    let userRole: string | null = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            isAuthenticated = true;
            userRole = (payload.role as string) || null;
        } catch {
            isAuthenticated = false;
        }
    }

    // Redirect authenticated users away from login page
    if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
        // VIEWER goes to /viewer, others go to /dashboard
        const redirectUrl = userRole === 'VIEWER' ? '/viewer' : '/dashboard';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Protect dashboard routes (not for VIEWER)
    if (pathname.startsWith('/dashboard') && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect VIEWER away from dashboard to /viewer
    if (pathname.startsWith('/dashboard') && userRole === 'VIEWER') {
        return NextResponse.redirect(new URL('/viewer', request.url));
    }

    // Protect viewer route
    if (pathname.startsWith('/viewer') && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/banned-ips/check).*)'],
};

