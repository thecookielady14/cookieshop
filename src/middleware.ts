import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect admin routes (excluding login page itself)
    if (
        request.nextUrl.pathname.startsWith('/admin') &&
        request.nextUrl.pathname !== '/admin/login'
    ) {
        // Supabase sets a cookie named sb-<project-ref>-auth-token when logged in.
        // We look for any cookie matching that pattern and verify it contains a real token.
        const supabaseAuthCookie = request.cookies.getAll().find(
            (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
        );

        let hasValidSession = false;
        if (supabaseAuthCookie?.value) {
            try {
                const parsed = JSON.parse(decodeURIComponent(supabaseAuthCookie.value));
                // A real Supabase session will have an access_token field
                hasValidSession = !!(parsed?.access_token || (Array.isArray(parsed) && parsed[0]));
            } catch {
                hasValidSession = false;
            }
        }

        if (!hasValidSession) {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
