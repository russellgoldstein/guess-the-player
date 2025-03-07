import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createGame } from '../../../src/utils/gameUtils';

export async function POST(request: Request) {
    const { title, creator_id, player_id, stats_config, game_options } = await request.json();

    try {
        const result = await createGame(
            title,
            creator_id,
            player_id,
            stats_config,
            game_options
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET() {
    try {
        // Create a new Supabase client for each request
        // This ensures we don't share clients across requests
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({
            cookies: () => cookieStore
        });

        const { data: games, error } = await supabase
            .from('games')
            .select(`
                *,
                game_player_config (*)
            `);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(games);
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
} 