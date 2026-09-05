import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail } from '@/lib/admin-auth';

export async function middleware(request: NextRequest) {
    if (
        request.nextUrl.pathname.startsWith('/admin') &&
        request.nextUrl.pathname !== '/admin/login'
    ) {
        const response = NextResponse.next({
            request: { headers: request.headers },
        });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // getUser() statt getSession(): der Token wird dabei serverseitig
        // gegen Supabase geprüft und lässt sich nicht im Browser fälschen.
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // Angemeldet zu sein reicht nicht – es muss ein Adminkonto sein.
        if (!isAdminEmail(user.email)) {
            const denied = new URL('/admin/login', request.url);
            denied.searchParams.set('error', 'no-access');
            return NextResponse.redirect(denied);
        }

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
