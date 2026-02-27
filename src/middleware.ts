import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if we're trying to access the admin area (excluding the login page itself)
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {

        // In a real app we'd verify the JWT token from Supabase here.
        // For this prototype/dev mode, we use a simple generic cookie check.
        const hasAdminCookie = request.cookies.has('admin_auth');

        if (!hasAdminCookie) {
            // Redirect to login if not authenticated
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
