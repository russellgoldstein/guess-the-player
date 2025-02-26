import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '../../../src/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const linkAccounts = requestUrl.searchParams.get('link_accounts') === 'true';

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

        try {
            await supabase.auth.exchangeCodeForSession(code);

            // Get the user from the session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Check if this user already exists in our users table
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // If the user doesn't exist in our users table, create a new record
                if (!existingUser) {
                    await supabase
                        .from('users')
                        .insert([{
                            id: session.user.id,
                            email: session.user.email,
                            username: session.user.email
                        }]);
                }
            }
        } catch (error) {
            console.error('Auth callback: Error exchanging code for session:', error);

            // If there's an email conflict and we're not trying to link accounts,
            // redirect to login with an error message
            if (error instanceof Error && error.message.includes('email already exists') && !linkAccounts) {
                const email = error.message.match(/email: ([^\s]+)/)?.[1];
                return NextResponse.redirect(
                    `${requestUrl.origin}/login?error_type=email_conflict&error_description=${encodeURIComponent(error.message)}&email=${encodeURIComponent(email || '')}`
                );
            }

            return NextResponse.redirect(
                `${requestUrl.origin}/login?error_description=${encodeURIComponent(error instanceof Error ? error.message : 'An error occurred during authentication')}`
            );
        }
    } else {
        console.error('Auth callback: No code provided');
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin);
} 