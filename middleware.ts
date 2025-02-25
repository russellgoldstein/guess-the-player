import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    // Create a Supabase client configured to use cookies
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session if expired
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // If accessing API routes and no session, return 401
    if (req.nextUrl.pathname.startsWith('/api/games/user') && !session) {
        console.log('Middleware: No session found for protected API route');
        return NextResponse.json(
            { error: 'Authentication required', message: 'Please log in to access this resource' },
            { status: 401 }
        );
    }

    return res;
}

// Specify which routes the middleware should run on
export const config = {
    matcher: [
        // Apply to all API routes that require authentication
        '/api/games/user/:path*',
    ],
}; 