import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        try {
            console.log('Auth callback: Exchanging code for session');
            await supabase.auth.exchangeCodeForSession(code);
            console.log('Auth callback: Session created successfully');
        } catch (error) {
            console.error('Auth callback: Error exchanging code for session:', error);
            return NextResponse.redirect(
                new URL(`/login?error=Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, requestUrl.origin)
            );
        }
    } else {
        console.error('Auth callback: No code provided');
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/', requestUrl.origin));
} 