import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET handler for fetching user's completed games
export async function GET(request: Request) {
    try {
        // Parse URL to get pagination parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('page_size') || '10', 10);
        const searchQuery = url.searchParams.get('search') || '';

        // Validate pagination parameters
        const validatedPage = Math.max(1, page);
        const validatedPageSize = Math.min(50, Math.max(1, pageSize)); // Limit page size between 1 and 50

        // Calculate offset
        const offset = (validatedPage - 1) * validatedPageSize;

        // Create Supabase client with server-side cookies using the auth-helpers
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Error getting session:', sessionError.message);
            return NextResponse.json(
                { error: 'Authentication error', message: sessionError.message },
                { status: 401 }
            );
        }

        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required', message: 'Please log in to view your completed games' },
                { status: 401 }
            );
        }

        // First, get all correct guesses with their game IDs only
        const { data: correctGuesses, error: guessesError } = await supabase
            .from('user_guesses')
            .select('game_id')
            .eq('user_id', session.user.id)
            .eq('is_correct', true);

        if (guessesError) {
            console.error('Error fetching correct guesses:', guessesError.message);
            return NextResponse.json(
                { error: 'Database error', message: guessesError.message },
                { status: 500 }
            );
        }

        if (!correctGuesses || correctGuesses.length === 0) {
            return NextResponse.json({
                games: [],
                pagination: {
                    page: validatedPage,
                    pageSize: validatedPageSize,
                    totalCount: 0,
                    totalPages: 0
                }
            });
        }

        // Extract unique game IDs to prevent duplicates
        const uniqueGameIds = Array.from(new Set(correctGuesses.map((guess: any) => guess.game_id)));

        // Fetch games with search if provided
        const gamesQuery = supabase
            .from('games')
            .select('*, game_player_config(*)', { count: 'exact' })
            .in('id', uniqueGameIds);

        if (searchQuery) {
            gamesQuery.ilike('title', `%${searchQuery}%`);
        }

        // Add pagination using the games table created_at
        // This won't sort by completion date, but it's a simple workaround to get things working
        const { data: games, error: gamesError, count } = await gamesQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + validatedPageSize - 1);

        if (gamesError) {
            console.error('Error fetching completed games:', gamesError.message);
            return NextResponse.json(
                { error: 'Database error', message: gamesError.message },
                { status: 500 }
            );
        }

        // Return games without trying to attach completion dates
        return NextResponse.json({
            games: games || [],
            pagination: {
                page: validatedPage,
                pageSize: validatedPageSize,
                totalCount: count || 0,
                totalPages: count ? Math.ceil(count / validatedPageSize) : 0
            }
        });
    } catch (error) {
        console.error('Unexpected error in GET /api/games/user/completed:', error);
        return NextResponse.json(
            { error: 'Server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 