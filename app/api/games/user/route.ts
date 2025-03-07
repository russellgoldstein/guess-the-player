import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET handler for fetching user games
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
                { error: 'Authentication required', message: 'Please log in to view your games' },
                { status: 401 }
            );
        }

        // Build the query
        let query = supabase
            .from('games')
            .select('*, game_player_config(*)', { count: 'exact' })
            .eq('creator_id', session.user.id);

        // Add search filter if provided
        if (searchQuery) {
            query = query.ilike('title', `%${searchQuery}%`);
        }

        // Add pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + validatedPageSize - 1);

        // Execute the query
        const { data: games, error: gamesError, count } = await query;

        if (gamesError) {
            console.error('Error fetching games:', gamesError.message);
            return NextResponse.json(
                { error: 'Database error', message: gamesError.message },
                { status: 500 }
            );
        }

        // Return paginated results with metadata
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
        console.error('Unexpected error in GET /api/games/user:', error);
        return NextResponse.json(
            { error: 'Server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// DELETE handler for deleting a user game
export async function DELETE(request: Request) {

    try {
        // Get the game ID from the URL
        const url = new URL(request.url);
        const gameId = url.searchParams.get('gameId');

        if (!gameId) {
            return NextResponse.json(
                { error: 'Missing game ID', message: 'Game ID is required' },
                { status: 400 }
            );
        }

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
                { error: 'Authentication required', message: 'Please log in to delete your games' },
                { status: 401 }
            );
        }

        // First check if the game belongs to the user - using creator_id instead of user_id
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select('creator_id')
            .eq('id', gameId)
            .single();

        if (gameError) {
            console.error('Error fetching game:', gameError.message);
            return NextResponse.json(
                { error: 'Database error', message: gameError.message },
                { status: 500 }
            );
        }

        if (!game) {
            return NextResponse.json(
                { error: 'Game not found', message: 'The specified game does not exist' },
                { status: 404 }
            );
        }

        if (game.creator_id !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You do not have permission to delete this game' },
                { status: 403 }
            );
        }

        // Delete the game
        const { error: deleteError } = await supabase
            .from('games')
            .delete()
            .eq('id', gameId);

        if (deleteError) {
            console.error('Error deleting game:', deleteError.message);
            return NextResponse.json(
                { error: 'Database error', message: deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Game deleted successfully' });
    } catch (error) {
        console.error('Unexpected error in DELETE /api/games/user:', error);
        return NextResponse.json(
            { error: 'Server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 