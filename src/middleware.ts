import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect admin routes (excluding login page itself)
    if (
        request.nextUrl.pathname.startsWith('/admin') &&
        request.nextUrl.pathname !== '/admin/login'
    ) {
        // admin_auth is set by the login page only AFTER a successful
        // supabase.auth.signInWithPassword call – so it's tied to real credentials.
        const hasAdminCookie = request.cookies.has('admin_auth');

        if (!hasAdminCookie) {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
